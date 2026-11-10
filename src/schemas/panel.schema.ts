import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type PanelDocument = Panel & Document;

@Schema({ timestamps: true })
export class Panel {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Number, required: true, enum: [1, 2, 3] }) // 3 = special panel
  stage: number;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'User' }])
  judges: Types.ObjectId[];

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Team' }])
  teams: Types.ObjectId[];

  // Added: Award type for Stage 2 panels
  @Prop({
    type: String,
    enum: [
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
    ],
  })
  awardType: string;

  // Special panel questions (scored 1–5) with optional score descriptions
  @Prop({
    type: [
      {
        question: String,
        descriptions: {
          score1: String,
          score2: String,
          score3: String,
          score4: String,
          score5: String,
        },
      },
    ],
    default: [],
  })
  awardCriteria: Array<{
    question: string;
    descriptions: {
      score1: string;
      score2: string;
      score3: string;
      score4: string;
      score5: string;
    };
  }>;
}

export const PanelSchema = SchemaFactory.createForClass(Panel);
PanelSchema.index({ stage: 1, awardType: 1 });
PanelSchema.index({ judges: 1 });
