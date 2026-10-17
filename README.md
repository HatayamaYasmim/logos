# Logos — Central de Resposta a Incidentes

Aplicação full stack para registrar, acompanhar e gerenciar incidentes em operações logísticas. 

O sistema centraliza ocorrências, permite acompanhar sua gravidade e situação e oferece indicadores para auxiliar a triagem operacional.

## Funcionalidades

- Autenticação de analistas com sessões por cookie `HttpOnly`.
- Cadastro, consulta, edição e exclusão de incidentes.
- Atualização do status das ocorrências.
- Filtros por gravidade, categoria e status, com paginação.
- Ordenação das ocorrências por prioridade.
- Painel com indicadores por gravidade e status.
- Controle de concorrência por versão, evitando que uma edição desatualizada sobrescreva alterações recentes.
- Registro do analista responsável pela última atualização.
- Interface responsiva com temas claro e escuro.
- Validações, mensagens de feedback e tratamento de erros.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4, TanStack Query, React Router, Lucide React e Sonner |
| Backend | Python 3.12, FastAPI, SQLAlchemy, Pydantic e Alembic |
| Banco de dados | PostgreSQL 17 (Docker Compose) |
| Autenticação | JWT assinado com HS256, Argon2, cookie `HttpOnly` e token CSRF |
| Qualidade | Pytest, Ruff e ESLint |

## Estrutura do repositório

```text
logos/
├── backend/
│   ├── alembic/             # Migrações do banco de dados
│   ├── app/
│   │   ├── api/             # Rotas e dependências
│   │   ├── core/            # Segurança e cookies
│   │   ├── database/        # Conexão e sessões do banco
│   │   ├── models/          # Modelos SQLAlchemy
│   │   ├── repositories/    # Acesso aos dados
│   │   ├── schemas/         # Schemas de entrada e saída
│   │   └── services/        # Regras de negócio
│   ├── scripts/
│   │   └── seed_demo.py     # Dados de demonstração
│   ├── tests/
│   ├── .env.example
│   ├── requirements.txt
│   └── start.sh
├── frontend/
│   ├── src/
│   ├── .env.example
│   └── package.json
└── docker-compose.yml
```

## Pré-requisitos

- Python **3.12**
- Node.js **22 ou superior**
- Docker Desktop com Docker Compose
- Git

Os comandos abaixo foram preparados para **Windows (CMD)**. Em outros sistemas, adapte a ativação do ambiente virtual e a cópia dos arquivos `.env`.

## Como executar localmente

### 1. Clonar o repositório

```cmd
git clone https://github.com/HatayamaYasmim/logos.git
cd logos
```

### 2. Iniciar o PostgreSQL

Na raiz do projeto:

```cmd
docker compose up -d
```

O container `logos-postgres` disponibiliza o PostgreSQL na porta **5435** do computador, direcionada à porta 5432 do container. O banco principal é `logos_db`.

### 3. Configurar e instalar o backend

```cmd
cd backend
copy .env.example .env
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
```

Abra `backend/.env` e substitua `JWT_SECRET_KEY` por uma chave aleatória e secreta. Mantenha a configuração local de desenvolvimento:

```env
DATABASE_URL=postgresql+psycopg://logos:logos_dev@localhost:5435/logos_db
TEST_DATABASE_URL=postgresql+psycopg://logos:logos_dev@localhost:5435/logos_test
JWT_SECRET_KEY=substitua_por_uma_chave_aleatoria_segura
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
COOKIE_SECURE=false
CORS_ORIGINS=http://localhost:5173
DEMO_SEED_ENABLED=false
DEMO_DATABASE_NAME=logos_db
```

> `COOKIE_SECURE=false` é exclusivo para desenvolvimento em HTTP. Em produção, utilize HTTPS e `COOKIE_SECURE=true`. Não versione o arquivo `.env`.

### 4. Aplicar as migrações

Ainda na pasta `backend`, execute:

```cmd
alembic upgrade head
```
### 5. Preparar os dados para avaliação

O Logos oferece duas maneiras de iniciar a utilização: carregar dados fictícios de demonstração ou cadastrar manualmente um analista.

#### Opção A — Utilizar os dados de demonstração (recomendado)

O projeto disponibiliza um seed com **2 analistas e 15 incidentes fictícios**, distribuídos entre diferentes categorias, níveis de gravidade e status.

No arquivo `backend/.env`, configure:

```env
DEMO_SEED_ENABLED=true
DEMO_DATABASE_NAME=logos_db
```

Após aplicar as migrations, execute na pasta `backend`:

```cmd
python -m scripts.seed_demo
```

O comando cadastra os dados demonstrativos no PostgreSQL. Executá-lo novamente não duplica os registros que já existem.

**Credenciais de demonstração**

| Usuário | E-mail | Senha |
|---|---|---|
| Analista Demonstração | demo@logos.local | 123456789012 |
| Analista Operacional | analista@logos.local | 123456789012 |

Com essas contas, é possível acessar imediatamente o dashboard, visualizar indicadores, consultar os incidentes e testar as funcionalidades do sistema.

> Os usuários, senhas e incidentes são exclusivos para desenvolvimento e demonstração. Não utilize essas credenciais em ambientes de produção reais.

#### Opção B — Cadastrar um analista manualmente

Caso prefira, você também pode criar seu próprio analista.

Com o ambiente virtual ativo, execute na pasta `backend`:

```cmd
python -c "from getpass import getpass; from app.database.session import SessionLocal; from app.models.user import User; from app.core.security import hash_password; db=SessionLocal(); name=input('Nome: '); email=input('Email: ').strip().lower(); password=getpass('Senha: '); db.add(User(name=name,email=email,password_hash=hash_password(password),is_active=True)); db.commit(); db.close(); print('Analista criado com sucesso.')"
```

O comando solicita nome, e-mail e senha. A senha é armazenada utilizando hash Argon2.

O e-mail informado deve ser único.

### 6. Iniciar o backend

```cmd
uvicorn app.main:app --reload --host localhost --port 8000
```

- API: http://localhost:8000
- Documentação interativa: http://localhost:8000/docs
- Verificação de saúde: http://localhost:8000/health

> As operações de escrita exigem o cabeçalho `Origin` autorizado; as rotas protegidas também exigem cookie de sessão e, nas operações de escrita, `X-CSRF-Token`. O fluxo de autenticação foi pensado principalmente para uso pelo frontend.

### 7. Configurar e iniciar o frontend

Abra **outro terminal** na raiz do projeto:

```cmd
cd frontend
copy .env.example .env
npm install
npm run dev
```

O frontend utiliza:

```env
VITE_API_URL=http://localhost:8000
```

Acesse **http://localhost:5173** e entre com uma das contas de demonstração ou com as credenciais do analista cadastrado manualmente.

> Utilize `localhost`, não `127.0.0.1`, para manter a configuração local de origem e cookies consistente.

## Principais endpoints

| Método | Rota | Finalidade |
| --- | --- | --- |
| `GET` | `/health` | Verificar disponibilidade da API |
| `POST` | `/auth/login` | Autenticar e iniciar sessão |
| `GET` | `/auth/me` | Recuperar a sessão atual |
| `POST` | `/auth/logout` | Encerrar a sessão |
| `GET` | `/incidents` | Listar, filtrar e paginar incidentes |
| `GET` | `/incidents/stats` | Consultar indicadores |
| `GET` | `/incidents/{id}` | Consultar um incidente |
| `POST` | `/incidents` | Criar um incidente |
| `PATCH` | `/incidents/{id}` | Editar dados de um incidente |
| `PATCH` | `/incidents/{id}/status` | Atualizar status |
| `DELETE` | `/incidents/{id}?version=1` | Excluir com controle de versão |

Em atualizações e exclusões, a versão enviada deve corresponder à versão atual do registro. Caso contrário, a API responde com **409 Conflict**.

## Segurança

- Senhas armazenadas com **Argon2**, nunca em texto puro.
- Sessão baseada em **JWT** transportado por cookie `HttpOnly` com `SameSite=Lax`.
- Cookie `Secure` habilitável por ambiente e obrigatório em produção HTTPS.
- Token CSRF associado à sessão, enviado pelo frontend em `X-CSRF-Token` nas operações de escrita.
- Validação da origem (`Origin`) das requisições de escrita e política CORS com origens permitidas.
- Endpoints de incidentes acessíveis apenas a analistas autenticados e ativos.
- Tratamento de conflitos de atualização para preservar a integridade dos dados.

## Testes e validação

Os testes de backend utilizam um banco separado chamado `logos_test`. **A suíte recria as tabelas desse banco**, portanto não utilize o banco principal como banco de testes.

Crie o banco de testes uma vez, na raiz do projeto:

```cmd
docker exec logos-postgres psql -U logos -d postgres -c "CREATE DATABASE logos_test;"
```

Na pasta `backend`, com o ambiente virtual ativo:

```cmd
python -m pytest -q
ruff check .
ruff format --check .
```

Para validar o frontend, na pasta `frontend`:

```cmd
npm run lint
npm run build
```

## Decisões técnicas

**Separação de responsabilidades.** O backend organiza rotas, validações, serviços, repositórios e modelos para reduzir o acoplamento e facilitar testes e manutenção.

**Concorrência otimista.** Cada incidente possui um campo `version`. Alterações concorrentes feitas a partir de uma versão antiga são rejeitadas, evitando sobrescritas silenciosas.

**Sessão com cookie `HttpOnly`.** O frontend não precisa armazenar o JWT em `localStorage` nem manipulá-lo diretamente. O acesso à API usa cookies de sessão, com proteção CSRF nas operações que alteram dados.

**Banco isolado para testes.** O ambiente de testes utiliza `logos_test`, distinto do banco de desenvolvimento `logos_db`.

## Repositório

Código-fonte: https://github.com/HatayamaYasmim/logos
