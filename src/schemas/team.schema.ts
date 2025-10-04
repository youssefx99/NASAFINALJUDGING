import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TeamDocument = Team & Document;

@Schema({ timestamps: true })
export class Team {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  challenge: string;

  @Prop({ required: true })
  leaderName: string;

  @Prop({ required: true })
  leaderEmail: string;

  @Prop()
  demoLink: string;

  @Prop()
  proposalLink: string;

  @Prop()
  projectLink: string;

  @Prop()
  nasaSubmitLink: string;

  @Prop()
  panelNumber: string;

  @Prop({ type: [String], default: [] })
  subjects: string[];

  @Prop()
  actualSolution: string; // Added: web, mobile, or ai

  @Prop({ type: Types.ObjectId, ref: 'Panel' })
  panelStage1: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Panel' })
  panelStage2: Types.ObjectId;

  @Prop({ default: false })
  qualifiedForStage2: boolean;
}

export const TeamSchema = SchemaFactory.createForClass(Team);