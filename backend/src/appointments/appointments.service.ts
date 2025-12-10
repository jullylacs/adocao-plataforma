import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment, AppointmentStatus, AppointmentType } from './appointment.entity';
import { Repository, Between, In, MoreThan } from 'typeorm';
import { Animal } from '../animals/animal.entity';
import { User } from '../users/user.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Animal)
    private animalsRepository: Repository<Animal>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async createAdoptionAppointment(
    userId: number, 
    data: { 
      animalId: number; 
      date_time: string; 
      location: string; 
      type?: AppointmentType;
      // REMOVIDO: notes?: string;
    }
  ) {
    // Verificar se animal existe
    const animal = await this.animalsRepository.findOne({ 
      where: { id: data.animalId } 
    });
    if (!animal) {
      throw new NotFoundException('Animal não encontrado');
    }

    // Verificar se animal está disponível para adoção
    if (animal.status !== 'available') {
      throw new BadRequestException('Este animal não está disponível para adoção no momento');
    }

    // Verificar se usuário existe
    const user = await this.usersRepository.findOne({ 
      where: { id: userId } 
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se já existe agendamento pendente para este animal e usuário
    const existingAppointment = await this.appointmentsRepository.findOne({
      where: {
        animal: { id: data.animalId },
        user: { id: userId },
        status: AppointmentStatus.PENDING,
      },
    });

    if (existingAppointment) {
      throw new BadRequestException('Você já tem um agendamento pendente para este animal');
    }

    // Verificar se há conflito de horário (opcional)
    const appointmentDate = new Date(data.date_time);
    const existingConflicts = await this.appointmentsRepository.find({
      where: {
        animal: { id: data.animalId },
        date_time: Between(
          new Date(appointmentDate.getTime() - 60 * 60 * 1000), // 1 hora antes
          new Date(appointmentDate.getTime() + 60 * 60 * 1000), // 1 hora depois
        ),
        status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
      },
    });

    if (existingConflicts.length > 0) {
      throw new BadRequestException('Já existe um agendamento próximo a este horário para este animal');
    }

    const appointment = this.appointmentsRepository.create({
      user,
      animal,
      date_time: appointmentDate,
      location: data.location,
      type: data.type || AppointmentType.ADOPTION_VISIT,
      status: AppointmentStatus.PENDING, // Sempre começa como pendente
      // REMOVIDO: notes: data.notes || null,
    });
    
    return this.appointmentsRepository.save(appointment);
  }

  async findByUser(userId: number) {
    return this.appointmentsRepository.find({
      where: { user: { id: userId } },
      relations: ['animal'],
      order: { date_time: 'DESC' },
    });
  }

  async findByAnimal(animalId: number) {
    return this.appointmentsRepository.find({
      where: { animal: { id: animalId } },
      relations: ['user'],
      order: { date_time: 'DESC' },
    });
  }

  async findAll(filters?: {
    status?: AppointmentStatus;
    animalId?: number;
    userId?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    const query = this.appointmentsRepository.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.animal', 'animal')
      .leftJoinAndSelect('appointment.user', 'user')
      .orderBy('appointment.date_time', 'DESC');

    if (filters?.status) {
      query.andWhere('appointment.status = :status', { status: filters.status });
    }

    if (filters?.animalId) {
      query.andWhere('animal.id = :animalId', { animalId: filters.animalId });
    }

    if (filters?.userId) {
      query.andWhere('user.id = :userId', { userId: filters.userId });
    }

    if (filters?.startDate) {
      query.andWhere('appointment.date_time >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('appointment.date_time <= :endDate', { endDate: filters.endDate });
    }

    return query.getMany();
  }

  async updateStatus(id: number, status: AppointmentStatus, adminNotes?: string) {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['animal', 'user'],
    });
    
    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }
    
    appointment.status = status;
    
    if (adminNotes) {
      appointment.adminNotes = adminNotes;
    }
    
    appointment.updated_at = new Date();
    
    return this.appointmentsRepository.save(appointment);
  }

  async cancelAppointment(id: number, userId: number, isAdmin: boolean = false) {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    
    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }
    
    // Verificar se o usuário tem permissão para cancelar
    if (!isAdmin && appointment.user.id !== userId) {
      throw new ForbiddenException('Você não tem permissão para cancelar este agendamento');
    }
    
    // Verificar se pode ser cancelado
    if ([AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.REJECTED].includes(appointment.status)) {
      throw new BadRequestException('Este agendamento não pode ser cancelado');
    }
    
    appointment.status = AppointmentStatus.CANCELLED;
    appointment.updated_at = new Date();
    
    return this.appointmentsRepository.save(appointment);
  }

  async getStatistics() {
    const total = await this.appointmentsRepository.count();
    const byStatus = await this.appointmentsRepository
      .createQueryBuilder('appointment')
      .select('appointment.status, COUNT(*) as count')
      .groupBy('appointment.status')
      .getRawMany();

    const upcoming = await this.appointmentsRepository.count({
      where: {
        status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
        date_time: MoreThan(new Date()),
      },
    });

    return {
      total,
      byStatus,
      upcoming,
    };
  }
}