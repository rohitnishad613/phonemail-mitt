import {
  IsNotEmpty,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phoneNumber!: string;

  @IsString()
  @Length(6, 8)
  otp!: string;
}