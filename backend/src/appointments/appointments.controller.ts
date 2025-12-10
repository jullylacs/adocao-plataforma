import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AppointmentStatus, AppointmentType } from './appointment.entity';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // Usuário adotante cria agendamento para visita de adoção
  @UseGuards(JwtAuthGuard)
  @Post()
  async createAdoptionAppointment(
    @Req() req: any,
    @Body()
    body: { 
      animalId: number; 
      date_time: string; 
      location: string; 
      type?: AppointmentType;
      // REMOVIDO: notes?: string;
    },
  ) {
    return this.appointmentsService.createAdoptionAppointment(req.user.id, body);
  }

  // Usuário vê seus próprios agendamentos
  @UseGuards(JwtAuthGuard)
  @Get('my-appointments')
  async myAppointments(@Req() req: any) {
    return this.appointmentsService.findByUser(req.user.id);
  }

  // Admin vê todos os agendamentos (com filtros)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  async findAll(
    @Query('status') status?: AppointmentStatus,
    @Query('animalId') animalId?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};
    
    if (status) {
      if (!Object.values(AppointmentStatus).includes(status)) {
        throw new BadRequestException('Status inválido');
      }
      filters.status = status;
    }
    
    if (animalId) {
      filters.animalId = parseInt(animalId);
    }
    
    if (userId) {
      filters.userId = parseInt(userId);
    }
    
    if (startDate) {
      filters.startDate = new Date(startDate);
    }
    
    if (endDate) {
      filters.endDate = new Date(endDate);
    }
    
    return this.appointmentsService.findAll(filters);
  }

  // Admin atualiza status do agendamento
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: AppointmentStatus; adminNotes?: string },
  ) {
    return this.appointmentsService.updateStatus(id, body.status, body.adminNotes);
  }

  // Usuário ou admin cancela agendamento
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async cancelAppointment(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const isAdmin = req.user.role === 'admin';
    return this.appointmentsService.cancelAppointment(id, req.user.id, isAdmin);
  }

  // Admin vê estatísticas
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('statistics')
  async getStatistics() {
    return this.appointmentsService.getStatistics();
  }

  // Ver agendamentos de um animal específico
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('animal/:animalId')
  async getAnimalAppointments(
    @Param('animalId', ParseIntPipe) animalId: number,
  ) {
    return this.appointmentsService.findByAnimal(animalId);
  }
}