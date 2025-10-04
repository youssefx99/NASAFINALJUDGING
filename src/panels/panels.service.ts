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
      .exec();
  }

  async findById(id: string): Promise<Panel | null> {
    return await this.panelModel
      .findById(id)
      .populate('judges', 'name email')
      .populate('teams', 'name challenge')
      .exec();
  }

  async createPanel(panelData: any): Promise<Panel> {
    const panel = new this.panelModel(panelData);
    const savedPanel = await panel.save();

    // Update judge assignments
    if (panelData.judges && panelData.judges.length > 0) {
      await this.updateJudgeAssignments(
        (savedPanel._id as any).toString(),
        panelData.stage,
        panelData.judges,
      );
    }

    return savedPanel;
  }

  async updatePanel(id: string, panelData: any): Promise<Panel> {
    // Get the old panel to see previous judge assignments
    const oldPanel = await this.panelModel.findById(id);

    const panel = await this.panelModel.findByIdAndUpdate(id, panelData, {
      new: true,
    });
    if (!panel) {
      throw new Error('Panel not found');
    }

    // Remove old judge assignments for this panel
    if (oldPanel && oldPanel.judges) {
      await this.removeJudgeAssignments(
        id,
        oldPanel.stage as any,
        oldPanel.judges,
      );
    }

    // Add new judge assignments
    if (panelData.judges && panelData.judges.length > 0) {
      await this.updateJudgeAssignments(id, panelData.stage, panelData.judges);
    }

    return panel;
  }

  async deletePanel(id: string): Promise<void> {
    // Get panel to remove judge assignments
    const panel = await this.panelModel.findById(id);
    if (panel && panel.judges) {
      await this.removeJudgeAssignments(id, panel.stage as any, panel.judges);
    }

    const result = await this.panelModel.findByIdAndDelete(id);
    if (!result) {
      throw new Error('Panel not found');
    }
  }

  async getPanelsByStage(stage: number): Promise<Panel[]> {
    return await this.panelModel
      .find({ stage })
      .populate('judges', 'name email')
      .populate('teams', 'name challenge')
      .exec();
  }

  private async updateJudgeAssignments(
    panelId: string,
    stage: number,
    judgeIds: string[],
  ): Promise<void> {
    for (const judgeId of judgeIds) {
      await this.userModel.findByIdAndUpdate(judgeId, {
        $addToSet: {
          panelAssignments: {
            stage: stage,
            panel: panelId,
          },
        },
      });
    }
  }

  private async removeJudgeAssignments(
    panelId: string,
    stage: number,
    judgeIds: any[],
  ): Promise<void> {
    const judgeIdStrings = judgeIds.map((id) => id.toString());

    for (const judgeId of judgeIdStrings) {
      await this.userModel.findByIdAndUpdate(judgeId, {
        $pull: {
          panelAssignments: {
            stage: stage,
            panel: panelId,
          },
        },
      });
    }
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

    const createdPanels: any[] = [];

    for (const awardType of awardTypes) {
      // Check if panel already exists
      const existingPanel = await this.panelModel.findOne({
        stage: 2,
        awardType: awardType,
      });

      if (!existingPanel) {
        const panel = new this.panelModel({
          name: `Stage 2 - ${awardType}`,
          stage: 2,
          awardType: awardType,
          judges: [],
          teams: [],
        });

        const savedPanel = await panel.save();
        createdPanels.push(savedPanel);
        console.log(`Created panel: ${awardType}`);
      } else {
        console.log(`Panel already exists: ${awardType}`);
      }
    }

    return {
      message: 'Stage 2 panels initialized',
      created: createdPanels.length,
      panels: await this.getPanelsByStage(2),
    };
  }
}
