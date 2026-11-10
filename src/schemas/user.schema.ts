import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ unique: true, required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, enum: ['admin', 'judge'] })
  role: string;

  @Prop([
    {
      stage: { type: Number, required: true },
      panel: { type: Types.ObjectId, ref: 'Panel', required: true },
    },
  ])
  panelAssignments: Array<{
    stage: number;
    panel: Types.ObjectId;
  }>;

  @Prop({ default: 0 })
  failedLoginAttempts: number;

  @Prop()
  lockUntil?: Date;

  @Prop()
  passwordChangedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
