import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email }).exec();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate a simple token (in production, use JWT)
    const token = Buffer.from(`${user._id}:${Date.now()}`).toString('base64');

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async createAdminUser() {
    const existingAdmin = await this.userModel
      .findOne({ email: 'admin@test.com' })
      .exec();

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('1234', 10);

      const admin = new this.userModel({
        name: 'Administrator',
        email: 'admin@test.com',
        passwordHash: hashedPassword,
        role: 'admin',
        panelAssignments: [],
      });

      await admin.save();
      console.log('Admin user created: admin@test.com / 1234');
    }
  }

  async validateCurrentPassword(
    userId: string,
    currentPassword: string,
  ): Promise<boolean> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return await bcrypt.compare(currentPassword, user.passwordHash);
  }

  validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      throw new BadRequestException(
        'New password and confirmation do not match',
      );
    }

    // Validate current password
    const isCurrentPasswordValid = await this.validateCurrentPassword(
      userId,
      currentPassword,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Validate new password strength
    const passwordValidation = this.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new BadRequestException(
        `Password validation failed: ${passwordValidation.errors.join(', ')}`,
      );
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(
      newPassword,
      (await this.userModel.findById(userId).exec()).passwordHash,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await this.userModel
      .findByIdAndUpdate(
        userId,
        { passwordHash: hashedNewPassword },
        { new: true },
      )
      .exec();

    return { message: 'Password changed successfully' };
  }
}
