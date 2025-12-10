import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Reservation } from '../reservations/reservation.entity';
import { Appointment } from '../appointments/appointment.entity';
import { Animal } from '../animals/animal.entity';
import { BadRequestException } from '@nestjs/common';

export enum UserRole {
  adotante = 'adotante',
  admin = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ 
    type: 'enum', 
    enum: UserRole, 
    default: UserRole.adotante 
  })
  role: UserRole;

  // Relação com reservas e agendamentos
  @OneToMany(() => Reservation, (reservation) => reservation.user)
  reservations: Reservation[];

  @OneToMany(() => Appointment, (appointment) => appointment.user)
  appointments: Appointment[];

  // -------------------------------------------------------
  // Relação com animais
  // -------------------------------------------------------

  @OneToMany(() => Animal, (animal) => animal.owner)
  adoptedAnimals: Animal[];

  @ManyToMany(() => Animal, (animal) => animal.interestedUser)
  @JoinTable({
    name: 'animal_interested_users', // 🔥 Nome consistente
    joinColumn: { 
      name: 'user_id', 
      referencedColumnName: 'id' 
    },
    inverseJoinColumn: { 
      name: 'animal_id', 
      referencedColumnName: 'id' 
    },
  })
  interestedAnimals: Animal[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  isAdmin(): boolean {
    return this.role === UserRole.admin;
  }

  isAdotante(): boolean {
    return this.role === UserRole.adotante;
  }
}