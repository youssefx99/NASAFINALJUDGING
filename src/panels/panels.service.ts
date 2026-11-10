import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Panel, PanelDocument } from '../schemas/panel.schema';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class PanelsService {
  constructor(
    @InjectModel(Panel.name) private panelModel: Model<PanelDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getAllPanels(): Promise<Panel[]> {
    return await this.panelModel
      .find()
      .populate('judges', 'name email')
      .populate('teams', 'name challenge')
      .lean()
      .exec();
  }

  async findById(id: string): Promise<Panel | null> {
    return await this.panelModel
      .findById(id)
      .populate('judges', 'name email')
      .populate('teams', 'name challenge')
      .lean()
      .exec();
  }

  async createPanel(panelData: any): Promise<Panel> {
    const panel = new this.panelModel(panelData);
    // Panel id exists before saving, so judge assignments are written in parallel
    const [savedPanel] = await Promise.all([
      panel.save(),
      this.syncJudgeAssignments(String(panel._id), [], panelData.stage, panelData.judges || []),
    ]);
    return savedPanel;
  }

  async updatePanel(id: string, panelData: any): Promise<Panel> {
    // The pre-update document gives the previous judges in the same round trip
    const oldPanel = await this.panelModel.findByIdAndUpdate(id, panelData, {
      new: false,
      runValidators: true,
    });
    if (!oldPanel) {
      throw new Error('Panel not found');
    }
    await this.syncJudgeAssignments(id, oldPanel.judges || [], panelData.stage ?? oldPanel.stage, panelData.judges ?? oldPanel.judges ?? [], oldPanel.stage);
    return Object.assign(oldPanel, panelData);
  }

  async deletePanel(id: string): Promise<void> {
    const result = await this.panelModel.findByIdAndDelete(id);
    if (!result) {
      throw new Error('Panel not found');
    }
    await Promise.all([
      this.syncJudgeAssignments(id, result.judges || [], result.stage, []),
      result.stage === 3
        ? this.panelModel.db.collection('scores').deleteMany({ stage: 3, panel: result._id })
        : null,
    ]);
  }

  async getPanelsByStage(stage: number): Promise<Panel[]> {
    return await this.panelModel
      .find({ stage })
      .populate('judges', 'name email')
      .populate('teams', 'name challenge')
      .lean()
      .exec();
  }

  // Mirrors panel.judges into each judge's panelAssignments in one ordered round trip
  private async syncJudgeAssignments(
    panelId: string,
    oldJudgeIds: any[],
    stage: number,
    newJudgeIds: any[],
    oldStage: number = stage,
  ): Promise<void> {
    const operations: any[] = [];
    if (oldJudgeIds.length) {
      operations.push({
        updateMany: {
          filter: { _id: { $in: oldJudgeIds } },
          update: { $pull: { panelAssignments: { stage: oldStage, panel: panelId } } },
        },
      });
    }
    if (newJudgeIds.length) {
      operations.push({
        updateMany: {
          filter: { _id: { $in: newJudgeIds } },
          update: { $addToSet: { panelAssignments: { stage, panel: panelId } } },
        },
      });
    }
    if (operations.length) await this.userModel.bulkWrite(operations, { ordered: true });
  }

  async createStage2Panels() {
    const awardTypes = [
      'Best Use of Science',
      'Best Use of Data',
      'Best Use of Technology',
      'Galactic Impact',
      'Best Mission Concept',
      'Most Inspirational',
      'Best Use of Storytelling',
      'Global Connection',
      'Art & Technology',
      'Local Impact',
    ];

    const existingAwardTypes = await this.panelModel.distinct('awardType', {
      stage: 2,
    });
    const createdPanels = await this.panelModel.insertMany(
      awardTypes
        .filter((awardType) => !existingAwardTypes.includes(awardType))
        .map((awardType) => ({
          name: `Stage 2 - ${awardType}`,
          stage: 2,
          awardType: awardType,
          judges: [],
          teams: [],
        })),
    );
    createdPanels.forEach((panel) =>
      console.log(`Created panel: ${panel.awardType}`),
    );

    return {
      message: 'Stage 2 panels initialized',
      created: createdPanels.length,
      panels: await this.getPanelsByStage(2),
    };
  }
}
