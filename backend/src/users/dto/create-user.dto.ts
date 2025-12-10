import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  IsArray,
} from 'class-validator';
import { UserRole } from '../user.entity';

export class CreateUserDto {
  @IsEmail({}, { message: 'O e-mail fornecido não é válido.' })
  email: string;

  @IsString({ message: 'A senha deve ser uma string.' })
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres.' })
  password: string;

  @IsString({ message: 'O nome deve ser uma string.' })
  @MaxLength(100, { message: 'O nome não pode exceder 100 caracteres.' })
  name: string;

  @IsOptional()
  @IsString({ message: 'O telefone deve ser uma string.' })
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole, {
    message: `A função deve ser um dos seguintes valores: ${Object.values(
      UserRole,
    ).join(', ')}`,
  })
  role?: UserRole;

  @IsOptional()
  @IsArray({ message: 'adoptedAnimals deve ser um array.' })
  @IsString({ each: true, message: 'Cada item de adoptedAnimals deve ser uma string.' })
  adoptedAnimals?: string[];

  @IsOptional()
  @IsArray({ message: 'interestedAnimals deve ser um array.' })
  @IsString({ each: true, message: 'Cada item de interestedAnimals deve ser uma string.' })
  interestedAnimals?: string[];
}
