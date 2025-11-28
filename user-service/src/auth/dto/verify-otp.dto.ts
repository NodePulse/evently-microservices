import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @IsString()
  @Length(6, 6, { message: 'OTP must be 6 digits long' })
  otp: string;
}
