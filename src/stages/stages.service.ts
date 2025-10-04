import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Stage, StageDocument } from '../schemas/stage.schema';

@Injectable()
export class StagesService {
  constructor(
    @InjectModel(Stage.name) private stageModel: Model<StageDocument>,
  ) {}

  async getAllStages(): Promise<Stage[]> {
    return await this.stageModel.find().exec();
  }

  async getStageByName(name: string): Promise<Stage | null> {
    return await this.stageModel.findOne({ name }).exec();
  }

  async updateStage(name: string, updateData: any): Promise<Stage> {
    const stage = await this.stageModel
      .findOneAndUpdate({ name }, updateData, { new: true, upsert: true })
      .exec();

    return stage;
  }

  async getAwardCriteria(awardType: string) {
    const stage2 = await this.stageModel.findOne({ name: 'Stage 2' }).exec();
    if (!stage2) {
      throw new Error('Stage 2 not found');
    }

    const awardCriteria = stage2.criteria.find((c) => c.name === awardType);
    if (!awardCriteria) {
      throw new Error(`Award criteria for ${awardType} not found`);
    }

    return awardCriteria;
  }

  async createDefaultStages() {
    const stage1Exists = await this.stageModel.findOne({ name: 'Stage 1' });
    const stage2Exists = await this.stageModel.findOne({ name: 'Stage 2' });

    if (!stage1Exists) {
      const stage1 = new this.stageModel({
        name: 'Stage 1',
        criteria: [
          {
            name: 'Innovation',
            weight: 0.3,
            questions: [
              'Does the solution demonstrate novel approaches or creative thinking?',
              'Are there innovative features that set it apart from existing solutions?',
              'Does it show originality in problem-solving methodology?',
            ],
          },
          {
            name: 'Technical Feasibility',
            weight: 0.3,
            questions: [
              'Is the technical approach realistic and achievable?',
              'Are the chosen technologies appropriate for the solution?',
              'Does the implementation demonstrate technical competence?',
            ],
          },
          {
            name: 'Impact',
            weight: 0.2,
            questions: [
              'Does the solution address a significant real-world problem?',
              'Will it have meaningful positive impact if implemented?',
            ],
          },
          {
            name: 'Presentation',
            weight: 0.2,
            questions: [
              'Is the presentation clear and well-organized?',
              'Are the materials professional and easy to understand?',
            ],
          },
        ],
      });
      await stage1.save();
      console.log('Stage 1 created');
    }

    if (!stage2Exists) {
      const stage2 = new this.stageModel({
        name: 'Stage 2',
        criteria: [
          {
            name: 'Advanced Scientific Methodology Rigor',
            weight: 0.5,
            questions: [
              'Uses established scientific methods correctly with standard approaches',
              'Applies sophisticated scientific methodology with enhanced analytical rigor',
            ],
          },
          {
            name: 'Advanced Technical Innovation',
            weight: 0.5,
            questions: [
              'Demonstrates breakthrough technical innovations',
              'Shows novel application of cutting-edge technologies',
              'Presents unique solutions to complex problems',
            ],
          },
        ],
      });
      await stage2.save();
      console.log('Stage 2 created');
    }
  }
}
