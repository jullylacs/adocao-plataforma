import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AnimalsService } from './animals.service';
import { AnimalStatus } from './animal.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller()
export class AnimalsController {
  constructor(private readonly animalsService: AnimalsService) {}

  // Rota pública para adotantes: SEMPRE mostra apenas animais disponíveis
  @Get('animals')
  async findAvailableAnimals(
    @Query('species') species?: string,
    @Query('size') size?: string,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number = 12,
  ) {
    // Não aceita parâmetro 'status' - sempre usa 'available'
    return this.animalsService.findAll({
      species,
      size,
      status: AnimalStatus.AVAILABLE, // 🔒 FORÇADO para 'available'
      search,
      page,
      limit,
    });
  }

  // Rota pública para detalhes de um animal - CORRIGIDA
  @Get('animals/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      console.log(`[Controller] Buscando animal ID: ${id}`);
      
      const animal = await this.animalsService.findOneSafe(id);
      
      // Se o animal não estiver disponível, não mostrar todos os detalhes
      if (animal.status !== AnimalStatus.AVAILABLE) {
        return {
          id: animal.id,
          name: animal.name,
          species: animal.species,
          age: animal.age,
          description: animal.description,
          mainPhotoUrl: animal.mainPhotoUrl,
          photoUrls: animal.photoUrls || [],
          status: animal.status,
          message: animal.status === AnimalStatus.ADOPTED 
            ? 'Este animal já foi adotado' 
            : 'Este animal está reservado',
        };
      }
      
      // Para animais disponíveis, retorne dados completos (sem relações cíclicas)
      return {
        id: animal.id,
        name: animal.name,
        species: animal.species,
        age: animal.age,
        description: animal.description,
        mainPhotoUrl: animal.mainPhotoUrl,
        photoUrls: animal.photoUrls || [],
        status: animal.status,
        createdAt: animal.created_at,
        updatedAt: animal.updated_at,
      };
      
    } catch (error) {
      console.error('[Controller] Erro ao buscar animal:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Erro interno ao buscar animal');
    }
  }

  // Rota de debug para testar
  @Get('debug/animals/:id')
  async debugAnimal(@Param('id', ParseIntPipe) id: number) {
    console.log(`=== DEBUG Animal ID: ${id} ===`);
    
    try {
      // Teste 1: Busca simples
      const animal = await this.animalsService.findOneSafe(id);
      
      // Teste 2: Contagem no banco
      const repository = this.animalsService['animalsRepository'];
      const count = await repository.count({ where: { id } });
      
      return {
        debug: true,
        animalExists: count > 0,
        animalId: id,
        animalData: animal ? {
          id: animal.id,
          name: animal.name,
          species: animal.species,
          status: animal.status,
          hasOwner: !!animal['ownerId']
        } : null,
        message: count > 0 ? 'Animal encontrado no banco' : 'Animal não encontrado'
      };
    } catch (error) {
      return {
        debug: true,
        error: error.message,
        stack: error.stack
      };
    }
  }

  // ⭐⭐ ROTA ESPECÍFICA PARA ADOTANTE LOGADO
  @UseGuards(JwtAuthGuard)
  @Get('adotante/animals')
  async findAnimalsForAdotante(
    @Query('species') species?: string,
    @Query('size') size?: string,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number = 12,
  ) {
    return this.animalsService.findAll({
      species,
      size,
      status: AnimalStatus.AVAILABLE,
      search,
      page,
      limit,
    });
  }

  // Rota admin para buscar UM animal - RETORNA DADOS COMPLETOS
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/animals/:id')
  async findOneAdmin(@Param('id', ParseIntPipe) id: number) {
    try {
      // Para admin, pode buscar dados completos
      const animal = await this.animalsService.findOne(id);
      
      // Remove relações cíclicas se necessário
      const response: any = { ...animal };
      
      if (response.owner && typeof response.owner === 'object') {
        response.owner = {
          id: response.owner.id,
          name: response.owner.name,
          email: response.owner.email
        };
      }
      
      if (response.interestedUser && Array.isArray(response.interestedUser)) {
        response.interestedUser = response.interestedUser.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email
        }));
      }
      
      return response;
    } catch (error) {
      console.error('Erro no findOneAdmin:', error);
      throw error;
    }
  }

  // Rota admin para listar todos os animais
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/animals')
  async findAllAdmin(
    @Query('species') species?: string,
    @Query('size') size?: string,
    @Query('status') status?: AnimalStatus,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number = 12,
  ) {
    const result = await this.animalsService.findAll({
      species,
      size,
      status, // Admin pode escolher o status
      search,
      page,
      limit,
    });

    if ('items' in result && Array.isArray(result.items)) {
      // Processa cada item para remover relações cíclicas
      const safeItems = result.items.map(animal => ({
        id: animal.id,
        name: animal.name,
        species: animal.species,
        age: animal.age,
        description: animal.description,
        mainPhotoUrl: animal.mainPhotoUrl,
        status: animal.status,
        photoUrls: animal.photoUrls || [],
        createdAt: animal.created_at,
        updatedAt: animal.updated_at,
      }));
      
      return {
        ...result,
        items: safeItems
      };
    }

    return result;
  }

  // Resto do controller permanece igual...
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/animals')
  async create(@Body() body: any) {
    return this.animalsService.create(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/animals/:id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.animalsService.update(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('admin/animals/:id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.animalsService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/animals/:id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: AnimalStatus,
  ) {
    return this.animalsService.updateStatus(id, status);
  }
}