// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { User } from './users/user.entity';
import { Animal } from './animals/animal.entity';
import { Reservation } from './reservations/reservation.entity';
import { Appointment } from './appointments/appointment.entity';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AnimalsModule } from './animals/animals.module';
import { ReservationsModule } from './reservations/reservations.module';
import { AppointmentsModule } from './appointments/appointments.module';

@Module({
  imports: [
    // 🔥 ConfigModule global para acessar variáveis de ambiente em qualquer lugar
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // TypeORM configurado usando variáveis de ambiente
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<number>('DB_PORT', 3306)),
        username: config.get<string>('DB_USERNAME', 'root'),
        password: config.get<string>('DB_PASSWORD', '12345'),
        database: config.get<string>('DB_DATABASE', 'happypet'),
        entities: [User, Animal, Reservation, Appointment],
        synchronize: true, // só em dev
        logging: true,
        logger: 'advanced-console',
      }),
    }),

    // Seus módulos
    AuthModule,
    UsersModule,
    AnimalsModule,
    ReservationsModule,
    AppointmentsModule,
  ],
})
export class AppModule {}
