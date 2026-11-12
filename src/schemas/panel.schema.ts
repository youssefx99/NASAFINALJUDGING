import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { QUESTION_TYPES, QuestionType } from '../common/scoring';

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

  // Stage 1 panels: ids of the Stage 1 criteria this panel scores (empty = all criteria)
  @Prop([{ type: MongooseSchema.Types.ObjectId }])
  criteria: Types.ObjectId[];

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

  // Special panel questions (yes/no or a 1–scaleMax scale) with optional score descriptions
  @Prop({
    type: [
      {
        question: String,
        type: { type: String, enum: QUESTION_TYPES },
        descriptions: {
          score1: String,
          score2: String,
          score3: String,
          score4: String,
          score5: String,
          score6: String,
          score7: String,
          score8: String,
          score9: String,
          score10: String,
        },
      },
    ],
    default: [],
  })
  awardCriteria: Array<{
    question: string;
    type?: QuestionType;
    descriptions: Record<string, string>;
  }>;

  // Special panels: top of the scale questions' 1–N range, and the yes/no share when both types are used
  @Prop({ type: Number, min: 2, max: 10 })
  scaleMax?: number;

  @Prop({ type: Number, min: 0, max: 1 })
  yesNoWeight?: number;
}

export const PanelSchema = SchemaFactory.createForClass(Panel);
PanelSchema.index({ stage: 1, awardType: 1 });
PanelSchema.index({ judges: 1 });

// Stage 1 criteria ids a judge scores a team on: the union over the Stage 1 panels they share; null = all criteria
export function stage1CriteriaIds(panels: Array<{ criteria?: Types.ObjectId[] }>): Set<string> | null {
  if (panels.some((panel) => !panel.criteria?.length)) return null;
  return new Set(panels.flatMap((panel) => panel.criteria!.map(String)));
}
