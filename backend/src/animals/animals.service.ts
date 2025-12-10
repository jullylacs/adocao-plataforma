import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Animal, AnimalStatus } from './animal.entity';

interface FilterParams {
  species?: string;
  size?: string;
  status?: AnimalStatus;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AnimalsService {
  constructor(
    @InjectRepository(Animal)
    private animalsRepository: Repository<Animal>,
  ) {}

  async create(data: Partial<Animal>): Promise<Animal> {
    try {
      const animal = this.animalsRepository.create({
        ...data,
        status: data.status || AnimalStatus.AVAILABLE,
        created_at: new Date(),
        updated_at: new Date(),
      });
      return await this.animalsRepository.save(animal);
    } catch (error) {
      console.error('Erro ao criar animal:', error);
      throw new InternalServerErrorException('Erro ao criar animal');
    }
  }

  async findAll(filters: FilterParams = {}) {
    try {
      const { species, size, status, search, page = 1, limit = 12 } = filters;
      const where: any = {};
      
      if (species) where.species = species;
      if (size) where.size = size;
      if (status) where.status = status;
      if (search) where.name = Like(`%${search}%`);

      const [items, total] = await this.animalsRepository.findAndCount({
        where,
        take: limit,
        skip: (page - 1) * limit,
        order: { created_at: 'DESC' },
        // 🔥 SELECIONE APENAS CAMPOS NECESSÁRIOS PARA LISTAGEM
        select: [
          'id',
          'name',
          'species',
          'age',
          'description',
          'status',
          'mainPhotoUrl',
          'photoUrls',
          'created_at',
          'updated_at'
        ]
      });

      return { items, total, page, limit };
    } catch (error) {
      console.error('Erro ao buscar animais:', error);
      throw new InternalServerErrorException('Erro ao buscar animais');
    }
  }

  // 🔥 MÉTODO SEGURO PARA ROTAS PÚBLICAS (sem relações)
  async findOneSafe(id: number): Promise<any> {
    console.log(`[Service] Buscando animal seguro ID: ${id}`);
    
    try {
      const animal = await this.animalsRepository.findOne({
        where: { id },
        // 🔥 SELECIONE APENAS OS CAMPOS NECESSÁRIOS
        select: [
          'id',
          'name',
          'species',
          'age',
          'description',
          'status',
          'mainPhotoUrl',
          'photoUrls',
          'created_at',
          'updated_at',
          'ownerId' // 🔥 INCLUA ownerId MAS NÃO A RELAÇÃO
        ]
      });

      if (!animal) {
        throw new NotFoundException(`Animal com ID ${id} não encontrado`);
      }

      console.log(`[Service] Animal encontrado (safe): ${animal.name}`);
      return animal;
    } catch (error) {
      console.error('[Service] Erro no findOneSafe:', error);
      
      // Se já for uma NotFoundException, re-lance
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      // Para outros erros, lance uma exceção genérica
      throw new InternalServerErrorException('Erro ao buscar animal');
    }
  }

  // 🔥 MÉTODO COMPLETO PARA ADMIN (com relações controladas)
  async findOne(id: number): Promise<any> {
    console.log(`[Service] Buscando animal completo ID: ${id}`);
    
    try {
      // 🔥 USE QUERY BUILDER PARA MAIS CONTROLE
      const animal = await this.animalsRepository
        .createQueryBuilder('animal')
        .leftJoinAndSelect('animal.owner', 'owner')
        .leftJoinAndSelect('animal.interestedUser', 'interestedUser')
        .select([
          'animal.id',
          'animal.name',
          'animal.species',
          'animal.age',
          'animal.description',
          'animal.status',
          'animal.mainPhotoUrl',
          'animal.photoUrls',
          'animal.created_at',
          'animal.updated_at',
          'owner.id',
          'owner.name',
          'owner.email',
          'interestedUser.id',
          'interestedUser.name',
          'interestedUser.email',
        ])
        .where('animal.id = :id', { id })
        .getOne();

      if (!animal) {
        throw new NotFoundException(`Animal com ID ${id} não encontrado`);
      }

      console.log(`[Service] Animal encontrado (completo): ${animal.name}`);
      return animal;
    } catch (error) {
      console.error('[Service] Erro detalhado no findOne:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Erro ao buscar animal completo');
    }
  }

  async update(id: number, data: Partial<Animal>): Promise<Animal> {
    try {
      const animal = await this.findOneSafe(id);
      
      if (animal.status === AnimalStatus.ADOPTED) {
        throw new ForbiddenException('Não é possível editar um animal já adotado');
      }

      const updatedData = {
        ...data,
        updated_at: new Date(),
      };

      await this.animalsRepository.update(id, updatedData);
      
      // Retorne o animal atualizado (sem relações para segurança)
      return this.findOneSafe(id);
    } catch (error) {
      console.error('Erro ao atualizar animal:', error);
      
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Erro ao atualizar animal');
    }
  }

  async remove(id: number): Promise<{ deleted: boolean; message?: string }> {
    try {
      const animal = await this.findOneSafe(id);

      if (animal.status === AnimalStatus.ADOPTED) {
        throw new ForbiddenException('Não é possível excluir um animal já adotado');
      }

      // 🔥 VERIFIQUE RESERVAS COM UMA QUERY SEPARADA
      const reservationsCount = await this.animalsRepository
        .createQueryBuilder('animal')
        .innerJoin('animal.reservations', 'reservation')
        .where('animal.id = :id', { id })
        .andWhere('reservation.status IN (:...statuses)', {
          statuses: ['active', 'pending']
        })
        .getCount();

      if (reservationsCount > 0) {
        throw new ForbiddenException('Não é possível excluir um animal com reservas ativas');
      }

      await this.animalsRepository.delete(id);
      
      return { 
        deleted: true,
        message: `Animal "${animal.name}" excluído com sucesso`
      };
    } catch (error) {
      console.error('Erro ao remover animal:', error);
      
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Erro ao excluir animal');
    }
  }

  async updateStatus(id: number, status: AnimalStatus): Promise<Animal> {
    try {
      const animal = await this.findOneSafe(id);
      animal.status = status;
      animal.updated_at = new Date();
      
      await this.animalsRepository.save(animal);
      return this.findOneSafe(id);
    } catch (error) {
      console.error('Erro ao atualizar status do animal:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Erro ao atualizar status do animal');
    }
  }

  async findByStatus(status: AnimalStatus): Promise<Animal[]> {
    try {
      return await this.animalsRepository.find({
        where: { status },
        select: [
          'id',
          'name',
          'species',
          'age',
          'description',
          'status',
          'mainPhotoUrl',
          'photoUrls',
          'created_at',
          'updated_at'
        ]
      });
    } catch (error) {
      console.error('Erro ao buscar animais por status:', error);
      throw new InternalServerErrorException('Erro ao buscar animais por status');
    }
  }

  // 🔥 MÉTODO DE DEBUG PARA DIAGNÓSTICO
  async debugFindOne(id: number): Promise<any> {
    console.log(`=== DEBUG Animal ID: ${id} ===`);
    
    try {
      // 1. Verifique se existe no banco
      const exists = await this.animalsRepository.count({ where: { id } });
      console.log(`Existe no banco? ${exists > 0 ? 'SIM' : 'NÃO'}`);
      
      if (exists === 0) {
        return { exists: false, error: 'Animal não encontrado no banco' };
      }

      // 2. Busca simples sem select
      const simpleAnimal = await this.animalsRepository.findOne({ where: { id } });
      console.log('Animal simples:', {
        id: simpleAnimal?.id,
        name: simpleAnimal?.name,
        species: simpleAnimal?.species,
        status: simpleAnimal?.status
      });

      // 3. Busca com query builder simples
      const qbAnimal = await this.animalsRepository
        .createQueryBuilder('animal')
        .select('animal.id, animal.name, animal.species')
        .where('animal.id = :id', { id })
        .getRawOne();

      console.log('Animal via QB:', qbAnimal);

      // 4. Estrutura da entidade
      const metadata = this.animalsRepository.metadata;
      const columns = metadata.columns.map(col => col.propertyName);
      console.log('Colunas da entidade Animal:', columns);

      return {
        exists: true,
        simpleAnimal: simpleAnimal ? {
          id: simpleAnimal.id,
          name: simpleAnimal.name,
          species: simpleAnimal.species,
          age: simpleAnimal.age,
          status: simpleAnimal.status
        } : null,
        columns
      };
    } catch (error) {
      console.error('Erro no debug:', error);
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }
}