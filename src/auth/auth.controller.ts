import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public, Roles } from '../common/decorators/auth.decorators';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    try {
      const result = await this.authService.login(
        loginDto?.email,
        loginDto?.password,
      );
      return result;
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS) {
        throw error;
      }
      throw new HttpException(
        { message: 'Invalid credentials' },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Post('change-password')
  @Roles('admin', 'judge')
  async changePassword(
    @Req() request: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    try {
      // Validate request body
      const { currentPassword, newPassword, confirmPassword } =
        changePasswordDto;

      if (
        [currentPassword, newPassword, confirmPassword].some(
          (value) => typeof value !== 'string' || !value || value.length > 200,
        )
      ) {
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
        token: result.token,
      };
    } catch (error: any) {
      throw new HttpException(
        { message: error.message || 'Failed to change password' },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
