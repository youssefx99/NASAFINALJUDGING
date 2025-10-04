import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PanelDocument = Panel & Document;

@Schema({ timestamps: true })
export class Panel {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Number, required: true }) // Changed from ObjectId to number
  stage: number;

  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  judges: Types.ObjectId[];

  @Prop([{ type: Types.ObjectId, ref: 'Team' }])
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

  // Stage 2 Award Criteria with scoring descriptions
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
