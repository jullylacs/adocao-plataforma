import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard'; 
import { Roles } from '../common/decorators/roles.decorator'; 

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {} 

  // ======================
  // ROTAS PÚBLICAS
  // ======================
  @Post('adotante')
  @HttpCode(HttpStatus.CREATED)
  async createAdotante(@Body() createUserDto: CreateUserDto): Promise<User> {
    return await this.usersService.createAdotante(createUserDto);
  }

  // ======================
  // ROTAS ADMIN (todos os usuários)
  // ======================
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  async findAll(): Promise<User[]> {
    return await this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('all/:id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('all/:id/interested-animals')
  async getUserInterestedAnimals(@Param('id', ParseIntPipe) userId: number) {
    return this.usersService.getInterestedAnimals(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('all/:id/adopted-animals')
  async getUserAdoptedAnimals(@Param('id', ParseIntPipe) userId: number) {
    return this.usersService.getAdoptedAnimals(userId);
  }

  // ======================
  // ROTAS DO USUÁRIO LOGADO (ME)
  // ======================
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: any): Promise<User | null> {
    const userId = req.user.id;
    return this.usersService.findById(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/interested-animals')
  async getMyInterestedAnimals(@Req() req: any) {
    const userId = req.user.id;
    return this.usersService.getInterestedAnimals(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/interested-animals/:animalId')
  async addInterest(@Req() req: any, @Param('animalId', ParseIntPipe) animalId: number) {
    const userId = req.user.id;
    return this.usersService.addInterest(userId, animalId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/interested-animals/:animalId')
  async removeInterest(@Req() req: any, @Param('animalId', ParseIntPipe) animalId: number) {
    const userId = req.user.id;
    return this.usersService.removeInterest(userId, animalId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/adopted-animals')
  async getMyAdoptedAnimals(@Req() req: any) {
    const userId = req.user.id;
    return this.usersService.getAdoptedAnimals(userId);
  }

  // ======================
  // ROTAS ADMIN PARA ANIMAIS (mantenha ou remova)
  // ======================
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/animals/:id')
  async updateAnimal(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    // Este endpoint provavelmente deveria estar no AnimalsController
    // Se mantiver aqui, implemente a lógica
  }
}