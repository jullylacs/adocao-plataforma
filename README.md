# HappyPet 🐾

Plataforma web completa de adoção responsável de animais, conectando pets em busca de um lar com pessoas dispostas a adotá-los.

---

## Visão Geral

O HappyPet é um monorepo com backend em **NestJS** e frontend em **Next.js 14**. O sistema possui dois perfis de usuário — administrador e adotante — com fluxos distintos de cadastro de animais, reservas e agendamentos de visitas.

---

## Tecnologias

| Camada     | Tecnologia                                      |
|------------|-------------------------------------------------|
| Backend    | NestJS 10, TypeORM, Passport JWT, bcrypt        |
| Frontend   | Next.js 14 (App Router), React 18, Tailwind CSS |
| Banco      | MySQL 8                                         |
| Estilização| Tailwind CSS, Bootstrap 5                       |

---

## Estrutura do Projeto

```
adocao-plataforma/
├── backend/          # API NestJS (porta 3003)
│   └── src/
│       ├── animals/
│       ├── appointments/
│       ├── auth/
│       ├── common/
│       ├── reservations/
│       └── users/
└── frontend/         # App Next.js (porta 3001)
    └── app/
        ├── admin/
        ├── adotante/
        ├── auth/
        ├── components/
        └── dashboard/
```

---

## Pré-requisitos

- Node.js 18+
- MySQL 8.0 rodando localmente
- npm

---

## Configuração do Banco de Dados

Crie o banco e configure o usuário no MySQL:

```sql
CREATE DATABASE happypet;
```

Se o root usar o plugin antigo de autenticação, rode:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'sua_senha';
FLUSH PRIVILEGES;
```

---

## Variáveis de Ambiente

Crie o arquivo `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=happypet
JWT_SECRET=happypet_secret_key
```

> O schema é sincronizado automaticamente pelo TypeORM (`synchronize: true`) — não é necessário rodar migrations.

---

## Instalação e Execução

### Backend

```bash
cd backend
npm install
npm run start:dev    # porta 3003, modo watch
```

### Frontend

```bash
cd frontend
npm install
npm run dev          # porta 3001
```

Acesse: [http://localhost:3001](http://localhost:3001)

---

## Rotas da API

### Autenticação (`/auth`)

| Método | Rota             | Descrição               | Auth |
|--------|------------------|-------------------------|------|
| POST   | /auth/register   | Cadastro de adotante    | —    |
| POST   | /auth/login      | Login (retorna JWT)     | —    |

### Usuários (`/users`)

| Método | Rota                                   | Descrição                    | Auth  |
|--------|----------------------------------------|------------------------------|-------|
| GET    | /users/me                              | Dados do usuário logado       | JWT   |
| POST   | /users/me/interested-animals/:id       | Adicionar animal aos favoritos| JWT   |
| DELETE | /users/me/interested-animals/:id       | Remover dos favoritos         | JWT   |

### Animais — público

| Método | Rota             | Descrição                            |
|--------|------------------|--------------------------------------|
| GET    | /animals         | Lista animais disponíveis (paginado) |
| GET    | /animals/:id     | Detalhes de um animal                |

Parâmetros de filtro: `species`, `search`, `page`, `limit`

### Animais — admin

| Método | Rota                        | Descrição                  | Auth       |
|--------|-----------------------------|----------------------------|------------|
| GET    | /admin/animals              | Lista todos os animais     | JWT + admin|
| GET    | /admin/animals/:id          | Detalhes completos         | JWT + admin|
| POST   | /admin/animals              | Cadastrar animal           | JWT + admin|
| PATCH  | /admin/animals/:id          | Editar animal              | JWT + admin|
| DELETE | /admin/animals/:id          | Remover animal             | JWT + admin|
| PATCH  | /admin/animals/:id/status   | Atualizar status           | JWT + admin|

---

## Modelo de Dados

### User
| Campo    | Tipo                       | Descrição                    |
|----------|----------------------------|------------------------------|
| id       | int (PK)                   |                              |
| email    | string (único)             |                              |
| password | string (hash bcrypt)       |                              |
| name     | string                     |                              |
| role     | enum: `admin`, `adotante`  | Default: `adotante`          |

### Animal
| Campo        | Tipo                                  | Descrição              |
|--------------|---------------------------------------|------------------------|
| id           | int (PK)                              |                        |
| name         | string                                |                        |
| species      | string                                | Cachorro, Gato, etc.   |
| age          | int                                   | Anos completos         |
| description  | text                                  |                        |
| status       | enum: `available`, `reserved`, `adopted` | Default: `available` |
| mainPhotoUrl | string (nullable)                     | URL ou base64          |
| photoUrls    | JSON array (nullable)                 | Fotos adicionais       |

### Reservation
| Campo            | Tipo                                           |
|------------------|------------------------------------------------|
| id               | int (PK)                                       |
| animal           | FK → Animal                                    |
| user             | FK → User                                      |
| reservation_date | datetime                                       |
| status           | enum: `pending`, `approved`, `rejected`, `completed` |

### Appointment
| Campo      | Tipo                                                              |
|------------|-------------------------------------------------------------------|
| id         | int (PK)                                                          |
| animal     | FK → Animal                                                       |
| user       | FK → User                                                         |
| date_time  | datetime                                                          |
| location   | string                                                            |
| type       | enum: `adoption_visit`, `adoption_pickup`                         |
| status     | enum: `pending`, `confirmed`, `completed`, `cancelled`, `rejected`|
| adminNotes | text (nullable)                                                   |

---

## Rotas do Frontend

| Rota                       | Acesso       | Descrição                          |
|----------------------------|--------------|------------------------------------|
| `/`                        | Público      | Home com carrossel e destaques     |
| `/auth/login`              | Público      | Login                              |
| `/auth/register`           | Público      | Cadastro de adotante               |
| `/adotante/animals`        | Público      | Listagem de animais disponíveis    |
| `/adotante/animals/:id`    | Público      | Detalhe do animal                  |
| `/adotante/dashboard`      | Adotante     | Painel com animais favoritos       |
| `/admin/dashboard`         | Admin        | Painel administrativo              |
| `/admin/animals`           | Admin        | Gerenciamento de animais           |
| `/admin/animals/register`  | Admin        | Cadastrar novo animal              |
| `/admin/animals/:id`       | Admin        | Detalhes e edição de animal        |

---

## Autenticação

- Login retorna um **JWT** salvo no `localStorage` (chave `token`)
- O papel do usuário é salvo na chave `role` (`admin` ou `adotante`)
- Rotas protegidas no backend usam `JwtAuthGuard` + `RolesGuard`
- O Header detecta o papel automaticamente via `GET /users/me`

---

## Funcionalidades

### Adotante
- Navegar e filtrar animais disponíveis
- Ver fotos e detalhes de cada animal
- Adicionar/remover animais dos favoritos
- Painel pessoal com lista de animais favoritos

### Administrador
- Cadastrar animais com foto por URL ou upload de arquivo (base64)
- Gerenciar todos os animais (editar, remover, alterar status)
- Visualizar dados completos de reservas e agendamentos

---

## Scripts disponíveis

```bash
# Backend
npm run start:dev    # desenvolvimento com hot reload
npm run build        # compilar TypeScript
npm run start:prod   # rodar build de produção

# Frontend
npm run dev          # desenvolvimento
npm run build        # build de produção
npm run start        # rodar build de produção
```

---

## Contribuição

1. Faça um fork do repositório
2. Crie uma branch: `git checkout -b minha-feature`
3. Commit suas mudanças: `git commit -m 'feat: minha feature'`
4. Push para a branch: `git push origin minha-feature`
5. Abra um Pull Request

---

## Licença

Este projeto foi desenvolvido para fins acadêmicos.
