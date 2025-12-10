import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn
} from 'typeorm';
import { User } from '../users/user.entity';
import { Reservation } from '../reservations/reservation.entity';
import { Appointment } from '../appointments/appointment.entity';

export enum AnimalStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  ADOPTED = 'adopted',
}

@Entity('animals')
export class Animal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  species: string;

  @Column()
  age: number;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: AnimalStatus,
    default: AnimalStatus.AVAILABLE,
  })
  status: AnimalStatus;

  @Column({ name: 'main_photo_url', nullable: true })
  mainPhotoUrl: string;

  @Column({ name: 'photo_urls', type: 'json', nullable: true })
  photoUrls: string[];

  @Column({ name: 'owner_id', nullable: true })
  ownerId: number;

  @ManyToOne(() => User, (user) => user.adoptedAnimals, { nullable: true })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  // 🔥 CORREÇÃO: Remova o @JoinTable() daqui
  @ManyToMany(() => User, (user) => user.interestedAnimals)
  interestedUser: User[];

  @OneToMany(() => Reservation, (reservation) => reservation.animal)
  reservations: Reservation[];

  @OneToMany(() => Appointment, (appointment) => appointment.animal)
  appointments: Appointment[];

  // 🔥 PADRONIZE OS NOMES (escolha um padrão)
  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}