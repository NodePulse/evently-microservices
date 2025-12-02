import {
  Body,
  Controller,
  Post,
  Get,
  Headers,
  UsePipes,
  ValidationPipe,
  Res,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ChangeForgotPasswordDto } from './dto/change-forgot-password.dto';
import { v4 as uuidv4 } from 'uuid';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import type { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { ApiRegisterDocs, ApiLoginDocs, ApiLogoutDocs } from '../docs/AuthDocs';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiRegisterDocs()
  @UsePipes(new ValidationPipe({ transform: true }))
  async registerUser(@Body() registerDto: RegisterDto) {
    const requestId = uuidv4();
    return this.authService.register(requestId, registerDto);
  }

  @Post('login')
  @ApiLoginDocs()
  @UsePipes(new ValidationPipe({ transform: true }))
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const requestId = uuidv4();
    return this.authService.login(requestId, loginDto, res);
  }

  @Post('logout')
  @ApiLogoutDocs()
  async logout(
    @Headers() headers: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const requestId = uuidv4();
    return this.authService.logout(requestId, headers, res);
  }

  @Get('me')
  async getMe(@Headers() headers: any) {
    const requestId = uuidv4();
    return this.authService.getMe(requestId, headers);
  }

  @Post('change-password')
  @UsePipes(new ValidationPipe({ transform: true }))
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Headers() headers: any,
  ) {
    const requestId = uuidv4();
    return this.authService.changePassword(
      requestId,
      changePasswordDto,
      headers,
    );
  }

  @Post('forgot-password')
  @UsePipes(new ValidationPipe({ transform: true }))
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const requestId = uuidv4();
    return this.authService.forgotPassword(requestId, forgotPasswordDto);
  }

  @Post('verify-otp')
  @UsePipes(new ValidationPipe({ transform: true }))
  async verifyOTP(@Body() verifyOtpDto: VerifyOtpDto) {
    const requestId = uuidv4();
    return this.authService.verifyOTP(requestId, verifyOtpDto);
  }

  @Post('change-forgot-password')
  @UsePipes(new ValidationPipe({ transform: true }))
  async changeForgotPassword(
    @Body() changeForgotPasswordDto: ChangeForgotPasswordDto,
  ) {
    const requestId = uuidv4();
    return this.authService.changeForgotPassword(
      requestId,
      changeForgotPasswordDto,
    );
  }
}
