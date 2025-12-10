import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './reservation.entity';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { Animal } from '../animals/animal.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, Animal, User])],
  providers: [ReservationsService],
  controllers: [ReservationsController],
})
export class ReservationsModule {}