import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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
      scoringDescriptions: [
        {
          score1: { type: String },
          score2: { type: String },
          score3: { type: String },
          score4: { type: String },
          score5: { type: String },
        },
      ],
    },
  ])
  criteria: Array<{
    _id?: Types.ObjectId;
    name: string;
    weight: number;
    questions: string[];
    scoringDescriptions?: Array<{
      score1: string;
      score2: string;
      score3: string;
      score4: string;
      score5: string;
    }>;
  }>;
}

export const StageSchema = SchemaFactory.createForClass(Stage);
