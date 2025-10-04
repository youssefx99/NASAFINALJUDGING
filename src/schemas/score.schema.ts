import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ScoreDocument = Score & Document;

@Schema({ timestamps: true })
export class Score {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  judge: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Team', required: true })
  team: Types.ObjectId;

  @Prop({ required: true })
  stage: number; // 1 or 2

  @Prop({ required: true, min: 0 })
  totalScore: number;

  @Prop({ type: Object })
  scores: Record<string, number[]>; // criterion name -> array of question scores

  @Prop({ type: Object })
  criteriaScores: Record<string, number>; // criterion name -> total score for that criterion

  // Added: Award type for Stage 2 scores
  @Prop({ type: String })
  awardType: string;
}

export const ScoreSchema = SchemaFactory.createForClass(Score);