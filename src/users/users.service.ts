import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Panel, PanelDocument } from '../schemas/panel.schema';
import * as bcrypt from 'bcrypt';
import { forgetCachedUser } from '../common/guards/auth.guard';

const PRIVATE_FIELDS = { passwordHash: 0, failedLoginAttempts: 0, lockUntil: 0, passwordChangedAt: 0 };

// Only these fields can be set through the API; password is hashed separately
function pickUserFields(userData: any) {
  const fields: Record<string, unknown> = {};
  if (typeof userData?.name === 'string') fields.name = userData.name.trim();
  if (typeof userData?.email === 'string') fields.email = userData.email.trim().toLowerCase();
  if (Array.isArray(userData?.panelAssignments)) fields.panelAssignments = userData.panelAssignments;
  if (userData?.password !== undefined) {
    if (typeof userData.password !== 'string' || userData.password.length < 8 || userData.password.length > 200) {
      throw new Error('Password must be at least 8 characters');
    }
  }
  return fields;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Panel.name) private panelModel: Model<PanelDocument>,
  ) {}

  async getJudges(): Promise<User[]> {
    return await this.userModel
      .find({ role: 'judge' }, PRIVATE_FIELDS)
      .populate('panelAssignments.panel', 'name stage awardType')
      .lean()
      .exec();
  }

  async findById(id: string): Promise<User | null> {
    return await this.userModel
      .findById(id, PRIVATE_FIELDS)
      .populate('panelAssignments.panel', 'name stage awardType')
      .lean()
      .exec();
  }

  async updateUser(id: string, userData: any): Promise<User> {
    const fields = pickUserFields(userData);
    // Hash password if provided; existing sessions of this user are revoked
    if (userData.password) {
      fields.passwordHash = await bcrypt.hash(userData.password, 10);
      fields.passwordChangedAt = new Date();
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, fields, { new: true, runValidators: true })
      .select(PRIVATE_FIELDS);
    if (!user) {
      throw new Error('User not found');
    }
    forgetCachedUser(id);

    // Sync panel assignments
    await this.syncJudgeToPanels(id, userData.panelAssignments || []);

    return user;
  }

  async createUser(userData: any): Promise<Omit<User, 'passwordHash' | 'failedLoginAttempts'>> {
    const fields = pickUserFields(userData);
    if (!userData.password) {
      throw new Error('Password must be at least 8 characters');
    }
    // Accounts created here are always judges
    const user = new this.userModel({
      ...fields,
      role: 'judge',
      passwordHash: await bcrypt.hash(userData.password, 10),
    });
    const savedUser = await user.save();

    // Sync panel assignments
    await this.syncJudgeToPanels(
      (savedUser as any)._id.toString(),
      userData.panelAssignments || [],
    );

    const { passwordHash, failedLoginAttempts, ...judge } = savedUser.toObject();
    return judge;
  }

  // Makes panel.judges match the judge's assignments: remove everywhere, then add (one ordered round trip)
  private async syncJudgeToPanels(
    judgeId: string,
    panelAssignments: any[],
  ): Promise<void> {
    const panelIds = panelAssignments
      .map((assignment) => assignment.panel)
      .filter(Boolean);
    const operations: any[] = [
        { updateMany: { filter: { judges: judgeId }, update: { $pull: { judges: judgeId } } } },
        ...(panelIds.length
          ? [{ updateMany: { filter: { _id: { $in: panelIds } }, update: { $addToSet: { judges: judgeId } } } }]
          : []),
    ];
    await this.panelModel.bulkWrite(operations, { ordered: true });
  }

  // Every judge (never admins), their panel seats and all their scores
  async deleteAllJudges(): Promise<{ deletedCount: number }> {
    const judgeIds = (await this.userModel.find({ role: 'judge' }, { _id: 1 }).lean().exec()).map((judge) => judge._id);
    const [result] = await Promise.all([
      this.userModel.deleteMany({ _id: { $in: judgeIds }, role: 'judge' }),
      this.panelModel.updateMany({ judges: { $in: judgeIds } }, { $pull: { judges: { $in: judgeIds } } }),
      this.panelModel.db.collection('scores').deleteMany({ judge: { $in: judgeIds } }),
    ]);
    judgeIds.forEach((id) => forgetCachedUser(String(id)));
    return { deletedCount: result.deletedCount || 0 };
  }

  async deleteUser(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error('User not found');
    }
    // A removed judge's scores are removed too, so they no longer count in any ranking
    const [result] = await Promise.all([
      this.userModel.findByIdAndDelete(id),
      this.panelModel.updateMany({ judges: id }, { $pull: { judges: id } }),
      this.panelModel.db.collection('scores').deleteMany({ judge: new Types.ObjectId(id) }),
    ]);
    forgetCachedUser(id);
    if (!result) {
      throw new Error('User not found');
    }
  }
}
