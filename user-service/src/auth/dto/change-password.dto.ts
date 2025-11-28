import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { Match } from '../../utils/match.decorator'; // We'll need to create this decorator

export class ChangePasswordDto {
  @IsString()
  @MinLength(8, { message: 'Old password must be at least 8 characters long' })
  @MaxLength(128)
  oldPassword: string;

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
