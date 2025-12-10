import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Animal } from '../animals/animal.entity';

export enum AppointmentStatus {
  PENDING = 'pending',      // Aguardando confirmação
  CONFIRMED = 'confirmed',  // Confirmado pelo admin
  COMPLETED = 'completed',  // Visita realizada
  CANCELLED = 'cancelled',  // Cancelado
  REJECTED = 'rejected',    // Rejeitado pelo admin
}

export enum AppointmentType {
  ADOPTION_VISIT = 'adoption_visit',    // Visita para conhecer o animal
  ADOPTION_PICKUP = 'adoption_pickup',  // Buscar o animal após aprovação
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Animal, (animal) => animal.appointments)
  @JoinColumn({ name: 'animal_id' })
  animal: Animal;

  @ManyToOne(() => User, (user) => user.appointments)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ 
    name: 'date_time',
    type: 'datetime' 
  })
  date_time: Date;

  @Column()
  location: string;

  @Column({ 
    type: 'enum', 
    enum: AppointmentStatus, 
    default: AppointmentStatus.PENDING 
  })
  status: AppointmentStatus;

  @Column({ 
    type: 'enum', 
    enum: AppointmentType, 
    default: AppointmentType.ADOPTION_VISIT 
  })
  type: AppointmentType;

  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes: string;  // Notas do administrador sobre o agendamento

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updated_at: Date;
}