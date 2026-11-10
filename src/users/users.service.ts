import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Panel, PanelDocument } from '../schemas/panel.schema';
import * as bcrypt from 'bcrypt';
import { forgetCachedUser } from '../common/guards/auth.guard';

const PRIVATE_FIELDS = { passwordHash: 0, failedLoginAttempts: 0, lockUntil: 0, passwordChangedAt: 0 };

// Only these fields can be set through the API; password is hashed separately
function pickUserFields(userData: any) {
  const fields: Record<string, unknown> = {};
  if (typeof userData?.name === 'string') fields.name = userData.name.trim();
  if (typeof userData?.email === 'string') fields.email = userData.email.trim();
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

  private async syncJudgeToPanels(
    judgeId: string,
    panelAssignments: any[],
  ): Promise<void> {
    // Remove judge from all panels first
    await this.panelModel.updateMany(
      { judges: judgeId },
      { $pull: { judges: judgeId } },
    );

    // Add judge to assigned panels
    const panelIds = panelAssignments
      .map((assignment) => assignment.panel)
      .filter(Boolean);
    if (panelIds.length > 0) {
      await this.panelModel.updateMany(
        { _id: { $in: panelIds } },
        { $addToSet: { judges: judgeId } },
      );
    }
  }

  async deleteUser(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id);
    if (!result) {
      throw new Error('User not found');
    }
    await this.panelModel.updateMany({ judges: id }, { $pull: { judges: id } });
    forgetCachedUser(id);
  }
}
