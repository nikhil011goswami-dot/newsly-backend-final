import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'rahul@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Rahul Sharma' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @ApiPropertyOptional({ example: 'rahul_sharma' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers and underscores',
  })
  username?: string;

  /**
   * Password rules (all required):
   *  - 8–72 characters
   *  - At least one uppercase letter
   *  - At least one lowercase letter
   *  - At least one digit
   *  - At least one special character (!@#$%^&* etc.)
   *
   * 72-char limit aligns with bcrypt/argon2 effective key length.
   */
  @ApiProperty({ example: 'MyP@ssw0rd!', description: 'Min 8 chars, upper, lower, digit, special char' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  password: string;
}
