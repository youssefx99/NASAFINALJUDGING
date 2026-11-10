import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { ChangePasswordDto } from './dto/change-password.dto';
import { forgetCachedUser } from '../common/guards/auth.guard';
import * as bcrypt from 'bcrypt';

const MAX_FAILED_LOGINS = 10;
const LOCK_MINUTES = 15;
// Compared against when the email doesn't exist, so response time doesn't reveal valid accounts
const DUMMY_HASH = '$2b$10$6/Y7a1SnCxhFSofTOe7lUeVCRXBSvFp07VHlw5Sd.Iy4GEbVuPYka';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  // pv ties the session to the current password: changing it revokes older tokens
  signToken(user: { _id: unknown; role: string; passwordChangedAt?: Date }) {
    return this.jwtService.sign({
      sub: String(user._id),
      role: user.role,
      pv: user.passwordChangedAt ? user.passwordChangedAt.getTime() : 0,
    });
  }

  async login(email: unknown, password: unknown) {
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password || password.length > 200) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.userModel.findOne({ email: email.trim().toLowerCase() }).exec();

    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      const minutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      throw new HttpException(
        { message: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.` },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      await this.userModel.updateOne(
        { _id: user._id },
        attempts >= MAX_FAILED_LOGINS
          ? { failedLoginAttempts: 0, lockUntil: new Date(Date.now() + LOCK_MINUTES * 60000) }
          : { failedLoginAttempts: attempts },
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.failedLoginAttempts || user.lockUntil) {
      await this.userModel.updateOne(
        { _id: user._id },
        { failedLoginAttempts: 0, $unset: { lockUntil: 1 } },
      );
    }

    const token = this.signToken(user);

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

  // Creates the admin account from ADMIN_EMAIL / ADMIN_PASSWORD when no admin exists yet
  async createAdminUser() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
      console.warn('ADMIN_EMAIL / ADMIN_PASSWORD not set: skipping admin bootstrap');
      return;
    }
    if (password.length < 12) {
      throw new Error('ADMIN_PASSWORD must be at least 12 characters');
    }

    const existingAdmin = await this.userModel.exists({ role: 'admin' }).exec();

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(password, 10);

      const admin = new this.userModel({
        name: 'Administrator',
        email,
        passwordHash: hashedPassword,
        role: 'admin',
        panelAssignments: [],
      });

      await admin.save();
      console.log(`Admin user created: ${email}`);
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
  ): Promise<{ message: string; token: string }> {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      throw new BadRequestException(
        'New password and confirmation do not match',
      );
    }

    // Validate new password strength
    const passwordValidation = this.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new BadRequestException(
        `Password validation failed: ${passwordValidation.errors.join(', ')}`,
      );
    }

    const existing = await this.userModel.findById(userId, { passwordHash: 1 }).lean().exec();
    if (!existing) {
      throw new UnauthorizedException('User not found');
    }
    // Both checks and the new hash run in parallel (bcrypt work happens on separate threads)
    const [isCurrentPasswordValid, isSamePassword, hashedNewPassword] = await Promise.all([
      bcrypt.compare(currentPassword, existing.passwordHash),
      bcrypt.compare(newPassword, existing.passwordHash),
      bcrypt.hash(newPassword, 10),
    ]);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Update; older sessions are revoked
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { passwordHash: hashedNewPassword, passwordChangedAt: new Date() },
        { new: true },
      )
      .exec();
    forgetCachedUser(userId);

    return {
      message: 'Password changed successfully',
      token: this.signToken(user!),
    };
  }
}
