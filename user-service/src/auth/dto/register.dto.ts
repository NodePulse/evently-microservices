import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  MaxLength,
  Matches,
  IsEnum,
} from 'class-validator';

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
}

export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(50, { message: 'Username cannot exceed 50 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]*$/, {
    message:
      'Password must contain at least one lowercase letter, one uppercase letter, one digit, and can include @$!%*?&',
  })
  password: string;

  @IsEnum(Gender, { message: 'Gender must be Male, Female, or Other' })
  gender: Gender;

  @IsString()
  @IsOptional()
  name?: string;
}
