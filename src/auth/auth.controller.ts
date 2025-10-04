import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    try {
      const result = await this.authService.login(
        loginDto.email,
        loginDto.password,
      );
      return result;
    } catch (error) {
      throw new HttpException(
        { message: 'Invalid credentials' },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Post('change-password')
  @UseGuards(AuthGuard)
  async changePassword(
    @Req() request: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    try {
      // Validate request body
      const { currentPassword, newPassword, confirmPassword } =
        changePasswordDto;

      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new HttpException(
          { message: 'All password fields are required' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const userId = request.user._id.toString();
      const result = await this.authService.changePassword(
        userId,
        changePasswordDto,
      );

      return {
        success: true,
        message: result.message,
      };
    } catch (error: any) {
      throw new HttpException(
        { message: error.message || 'Failed to change password' },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
