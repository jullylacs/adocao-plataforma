import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';
import { Animal, AnimalStatus } from '../animals/animal.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Animal)
    private animalsRepository: Repository<Animal>,
  ) {}

  // ------------------------------
  // CRUD DE USUÁRIOS
  // ------------------------------

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ 
      where: { email },
      relations: ['interestedAnimals', 'adoptedAnimals'],
    });
  }

  findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ 
      where: { id },
      relations: ['interestedAnimals', 'adoptedAnimals', 'reservations', 'appointments'],
    });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt'],
    });
  }

  async createAdotante(data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    address?: string;
  }): Promise<User> {
    try {
      const existingUser = await this.findByEmail(data.email);
      if (existingUser) {
        throw new ConflictException('Email já está em uso');
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const user = this.usersRepository.create({
        ...data,
        password: hashedPassword,
        role: UserRole.adotante,
      });

      this.logger.log(`Criando adotante: ${user.email}`);
      return await this.usersRepository.save(user);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // ------------------------------
  // INTERESSE EM ANIMAIS - VERSÃO ATUALIZADA E SEGURA
  // ------------------------------

  async addInterest(userId: number, animalId: number, limit = 20): Promise<User> {
    this.logger.log(`[addInterest] Iniciando - Usuário: ${userId}, Animal: ${animalId}`);
    
    try {
      // 1. Buscar usuário SEM relações para verificação básica
      const user = await this.usersRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        this.logger.error(`[addInterest] Usuário ${userId} não encontrado`);
        throw new NotFoundException('Usuário não encontrado');
      }

      // 2. Buscar animal SEM relações
      const animal = await this.animalsRepository.findOne({
        where: { id: animalId },
      });

      if (!animal) {
        this.logger.error(`[addInterest] Animal ${animalId} não encontrado`);
        throw new NotFoundException('Animal não encontrado');
      }

      this.logger.log(`[addInterest] Animal encontrado: ${animal.name}, Status: ${animal.status}`);
      
      // 3. Verificar status do animal
      if (animal.status === AnimalStatus.ADOPTED) {
        throw new BadRequestException('Não é possível demonstrar interesse em um animal já adotado.');
      }

      if (animal.status === AnimalStatus.RESERVED) {
        throw new BadRequestException('Animal já está reservado.');
      }

      // 4. Verificar se já tem interesse usando query builder
      const existingInterest = await this.usersRepository
        .createQueryBuilder('user')
        .innerJoin('user.interestedAnimals', 'animal')
        .where('user.id = :userId', { userId })
        .andWhere('animal.id = :animalId', { animalId })
        .getCount();

      if (existingInterest > 0) {
        throw new BadRequestException('Você já demonstrou interesse neste animal.');
      }

      // 5. Verificar limite de interesses
      const interestCount = await this.usersRepository
        .createQueryBuilder('user')
        .leftJoin('user.interestedAnimals', 'animal')
        .where('user.id = :userId', { userId })
        .getCount();

      if (interestCount >= limit) {
        throw new BadRequestException(`Você só pode marcar interesse em até ${limit} animais.`);
      }

      // 6. 🔥 ADICIONAR INTERESSE usando query runner (transação segura)
      const queryRunner = this.usersRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        this.logger.log(`[addInterest] Iniciando transação para inserir interesse`);
        
        // Tentar inserir na tabela de junção
        await queryRunner.query(
          `INSERT INTO animal_interested_users (user_id, animal_id) VALUES (?, ?)`,
          [userId, animalId]
        );

        await queryRunner.commitTransaction();
        this.logger.log(`[addInterest] Interesse adicionado com sucesso na transação!`);
        
      } catch (transactionError) {
        await queryRunner.rollbackTransaction();
        
        // Se for erro de duplicação (pode acontecer em race conditions)
        if (transactionError.code === 'ER_DUP_ENTRY' || transactionError.errno === 1062) {
          this.logger.warn(`[addInterest] Interesse duplicado detectado: ${transactionError.message}`);
          throw new BadRequestException('Você já demonstrou interesse neste animal.');
        }
        
        // Se for erro de coluna não encontrada, a tabela pode ter nome diferente
        if (transactionError.code === 'ER_BAD_FIELD_ERROR') {
          this.logger.warn(`[addInterest] Tabela com estrutura diferente, tentando abordagem alternativa`);
          
          // Tentar abordagem alternativa usando o repositório
          await this.addInterestAlternative(userId, animalId);
        } else {
          this.logger.error(`[addInterest] Erro na transação:`, transactionError);
          throw new InternalServerErrorException('Erro ao adicionar interesse. Tente novamente.');
        }
      } finally {
        await queryRunner.release();
      }

      // 7. Retornar usuário atualizado com interesses
      const updatedUser = await this.usersRepository.findOne({
        where: { id: userId },
        relations: ['interestedAnimals'],
      });

      this.logger.log(`[addInterest] Finalizado com sucesso! Interesses totais: ${updatedUser?.interestedAnimals?.length || 0}`);
      return updatedUser;
      
    } catch (error) {
      this.logger.error(`[addInterest] Erro geral:`, error);
      
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException ||
          error instanceof ConflictException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Erro ao adicionar interesse. Tente novamente.');
    }
  }

  // Método alternativo caso a abordagem principal falhe
  private async addInterestAlternative(userId: number, animalId: number): Promise<void> {
    this.logger.log(`[addInterestAlternative] Usando abordagem alternativa`);
    
    try {
      // Buscar usuário com interesses
      const user = await this.usersRepository.findOne({
        where: { id: userId },
        relations: ['interestedAnimals'],
      });

      if (!user) throw new NotFoundException('Usuário não encontrado');

      // Buscar animal
      const animal = await this.animalsRepository.findOne({
        where: { id: animalId },
      });

      if (!animal) throw new NotFoundException('Animal não encontrado');

      // Verificar se já tem interesse
      const alreadyInterested = user.interestedAnimals?.some(a => a.id === animal.id) || false;
      if (alreadyInterested) {
        throw new BadRequestException('Você já demonstrou interesse neste animal.');
      }

      // Adicionar interesse
      if (!user.interestedAnimals) {
        user.interestedAnimals = [];
      }
      user.interestedAnimals.push(animal);
      
      await this.usersRepository.save(user);
      
      this.logger.log(`[addInterestAlternative] Interesse adicionado com sucesso via repositório`);
      
    } catch (error) {
      this.logger.error(`[addInterestAlternative] Erro:`, error);
      throw error;
    }
  }

  async removeInterest(userId: number, animalId: number): Promise<User> {
    this.logger.log(`[removeInterest] Removendo interesse - Usuário: ${userId}, Animal: ${animalId}`);
    
    try {
      // 1. Remover da tabela de junção usando query runner
      const queryRunner = this.usersRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Tentar remover da tabela de junção
        await queryRunner.query(
          `DELETE FROM animal_interested_users WHERE user_id = ? AND animal_id = ?`,
          [userId, animalId]
        );

        await queryRunner.commitTransaction();
        this.logger.log(`[removeInterest] Interesse removido da tabela de junção`);
        
      } catch (transactionError) {
        await queryRunner.rollbackTransaction();
        this.logger.warn(`[removeInterest] Erro ao remover da tabela, usando abordagem alternativa:`, transactionError);
        
        // Abordagem alternativa
        await this.removeInterestAlternative(userId, animalId);
      } finally {
        await queryRunner.release();
      }

      // 2. Retornar usuário atualizado
      const updatedUser = await this.usersRepository.findOne({
        where: { id: userId },
        relations: ['interestedAnimals'],
      });

      this.logger.log(`[removeInterest] Finalizado com sucesso!`);
      return updatedUser;
      
    } catch (error) {
      this.logger.error(`[removeInterest] Erro:`, error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Erro ao remover interesse. Tente novamente.');
    }
  }

  private async removeInterestAlternative(userId: number, animalId: number): Promise<void> {
    this.logger.log(`[removeInterestAlternative] Usando abordagem alternativa`);
    
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['interestedAnimals'],
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    // Remover animal da lista de interesses do usuário
    if (user.interestedAnimals) {
      user.interestedAnimals = user.interestedAnimals.filter(a => a.id !== animalId);
      await this.usersRepository.save(user);
    }
  }

  async getInterestedAnimals(userId: number): Promise<Animal[]> {
    this.logger.log(`[getInterestedAnimals] Buscando animais interessados para usuário: ${userId}`);
    
    try {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
        relations: ['interestedAnimals'],
      });

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }
      
      this.logger.log(`[getInterestedAnimals] Encontrados ${user.interestedAnimals?.length || 0} animais`);
      return user.interestedAnimals || [];
      
    } catch (error) {
      this.logger.error(`[getInterestedAnimals] Erro:`, error);
      throw error;
    }
  }

  async getAdoptedAnimals(userId: number): Promise<Animal[]> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['adoptedAnimals'],
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');
    
    return user.adoptedAnimals || [];
  }

  // ------------------------------
  // ADOÇÃO DE ANIMAIS
  // ------------------------------

  async adoptAnimal(userId: number, animalId: number): Promise<Animal> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const animal = await this.animalsRepository.findOne({
      where: { id: animalId },
      relations: ['owner', 'interestedUser'],
    });

    if (!animal) throw new NotFoundException('Animal não encontrado');

    if (animal.owner) {
      throw new BadRequestException('Este animal já possui dono.');
    }

    if (animal.status !== AnimalStatus.AVAILABLE && animal.status !== AnimalStatus.RESERVED) {
      throw new BadRequestException('Animal não está disponível para adoção.');
    }

    // Atualiza animal
    animal.owner = user;
    animal.status = AnimalStatus.ADOPTED;
    
    // Remover de interessados
    if (animal.interestedUser) {
      animal.interestedUser = animal.interestedUser.filter(u => u.id !== userId);
    }

    return await this.animalsRepository.save(animal);
  }

  // ------------------------------
  // MÉTODOS AUXILIARES
  // ------------------------------

  private handleDatabaseError(error: any): never {
    this.logger.error('Erro no banco de dados', error);

    if (error.code === '23505' || error.code === '1062') {
      throw new ConflictException('Email já está em uso');
    }

    if (error instanceof ConflictException || error instanceof BadRequestException) {
      throw error;
    }

    throw new InternalServerErrorException('Erro interno do servidor');
  }

  // 🔥 NOVO: Método para verificar estrutura do banco (para debug)
  async checkDatabaseStructure(): Promise<any> {
    try {
      const connection = this.usersRepository.manager.connection;
      
      // Verificar tabelas
      const tables = await connection.query(`
        SHOW TABLES LIKE 'animal_interested%'
      `);
      
      // Verificar estrutura da tabela de junção
      let tableStructure = null;
      if (tables.length > 0) {
        const tableName = Object.values(tables[0])[0];
        tableStructure = await connection.query(`
          DESCRIBE ${tableName}
        `);
      }
      
      return {
        tables,
        tableStructure,
        message: tables.length > 0 ? 'Tabela encontrada' : 'Tabela não encontrada'
      };
    } catch (error) {
      this.logger.error('Erro ao verificar estrutura do banco:', error);
      return { error: error.message };
    }
  }
}