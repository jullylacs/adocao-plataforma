import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Reservation, ReservationStatus } from './reservation.entity';
import { Repository } from 'typeorm';
import { Animal } from '../animals/animal.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,
    @InjectRepository(Animal)
    private animalsRepository: Repository<Animal>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async createReservation(userId: number, animalId: number) {
    const animal = await this.animalsRepository.findOne({ where: { id: animalId } });
    if (!animal) throw new NotFoundException('Animal não encontrado');

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const reservation = this.reservationsRepository.create({
      user,
      animal,
      reservation_date: new Date(),
      status: ReservationStatus.PENDING,
    });
    return this.reservationsRepository.save(reservation);
  }

  findByUser(userId: number) {
    return this.reservationsRepository.find({
      where: { user: { id: userId } },
      relations: ['animal'],
      order: { created_at: 'DESC' },
    });
  }

  findByAnimal(animalId: number) {
    return this.reservationsRepository.find({
      where: { animal: { id: animalId } },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async updateStatus(id: number, status: ReservationStatus) {
    await this.reservationsRepository.update(id, { status });
    return this.reservationsRepository.findOne({ where: { id }, relations: ['animal', 'user'] });
  }
}