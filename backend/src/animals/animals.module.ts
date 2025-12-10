import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Animal } from './animal.entity';
import { AnimalsService } from './animals.service';
import { AnimalsController } from './animals.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Animal])],
  providers: [AnimalsService],
  controllers: [AnimalsController],
})
export class AnimalsModule {}