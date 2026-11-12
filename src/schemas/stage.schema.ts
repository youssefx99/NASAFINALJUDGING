import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { QUESTION_TYPES, QuestionType } from '../common/scoring';

export type StageDocument = Stage & Document;

@Schema({ timestamps: true })
export class Stage {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Number, default: 30 })
  timerMinutes: number;

  // Stage 1 only: its share of the final score (0–1); Stage 2 gets the rest
  @Prop({ type: Number, min: 0, max: 1 })
  finalWeight?: number;

  @Prop([
    {
      name: { type: String, required: true },
      weight: { type: Number, required: true },
      questions: [{ type: String }],
      // Parallel to questions; missing = 'yesno' in Stage 1, 'scale' in Stage 2
      questionTypes: [{ type: String, enum: QUESTION_TYPES }],
      scaleMax: { type: Number, min: 2, max: 10 },
      // Share of the criterion carried by its yes/no questions when it mixes both types
      yesNoWeight: { type: Number, min: 0, max: 1 },
      scoringDescriptions: [
        {
          score1: { type: String },
          score2: { type: String },
          score3: { type: String },
          score4: { type: String },
          score5: { type: String },
          score6: { type: String },
          score7: { type: String },
          score8: { type: String },
          score9: { type: String },
          score10: { type: String },
        },
      ],
    },
  ])
  criteria: Array<{
    _id?: Types.ObjectId;
    name: string;
    weight: number;
    questions: string[];
    questionTypes?: QuestionType[];
    scaleMax?: number;
    yesNoWeight?: number;
    scoringDescriptions?: Array<Record<string, string>>;
  }>;
}

export const StageSchema = SchemaFactory.createForClass(Stage);
