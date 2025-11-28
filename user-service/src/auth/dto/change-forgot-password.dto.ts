import {
  IsEmail,
  IsString,
  Length,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Match } from '../../utils/match.decorator';

export class ChangeForgotPasswordDto {
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @IsString()
  @Length(6, 6, { message: 'OTP must be 6 digits long' })
  otp: string;

  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one lowercase letter, one uppercase letter, and one digit',
  })
  newPassword: string;

  @IsString()
  @MinLength(8)
  @Match('newPassword', { message: 'Passwords do not match' })
  confirmPassword: string;
}
