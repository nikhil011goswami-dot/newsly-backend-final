import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'MyOldPass@123' })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    example: 'MyNewPass@456',
    description: 'Min 8 chars, at least one uppercase, one lowercase, one number, one special char',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}|:<>?])/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  newPassword: string;
}
