import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Panel, PanelDocument } from '../schemas/panel.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Panel.name) private panelModel: Model<PanelDocument>,
  ) {}

  async getJudges(): Promise<User[]> {
    return await this.userModel
      .find({ role: 'judge' }, { passwordHash: 0 })
      .populate('panelAssignments.panel', 'name stage awardType')
      .lean()
      .exec();
  }

  async findById(id: string): Promise<User | null> {
    return await this.userModel
      .findById(id, { passwordHash: 0 })
      .populate('panelAssignments.panel', 'name stage awardType')
      .lean()
      .exec();
  }

  async updateUser(id: string, userData: any): Promise<User> {
    // Hash password if provided
    if (userData.password) {
      userData.passwordHash = await bcrypt.hash(userData.password, 10);
      delete userData.password;
    }

    const user = await this.userModel.findByIdAndUpdate(id, userData, {
      new: true,
    });
    if (!user) {
      throw new Error('User not found');
    }

    // Sync panel assignments
    await this.syncJudgeToPanels(id, userData.panelAssignments || []);

    return user;
  }

  async createUser(userData: any): Promise<User> {
    // Hash password if provided
    if (userData.password) {
      userData.passwordHash = await bcrypt.hash(userData.password, 10);
      delete userData.password;
    }

    const user = new this.userModel(userData);
    const savedUser = await user.save();

    // Sync panel assignments
    await this.syncJudgeToPanels(
      (savedUser as any)._id.toString(),
      userData.panelAssignments || [],
    );

    return savedUser;
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
  }
}
