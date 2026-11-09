import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type ScoreDocument = Score & Document;

@Schema({ timestamps: true })
export class Score {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  judge: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Team', required: true })
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
ScoreSchema.index({ judge: 1, team: 1, stage: 1 });
ScoreSchema.index({ team: 1, stage: 1 });
ScoreSchema.index({ stage: 1, awardType: 1, team: 1 });