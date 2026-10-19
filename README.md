# Logos — Central de Resposta a Incidentes

Aplicação full stack para registrar, acompanhar e gerenciar incidentes em operações logísticas. 

O sistema centraliza ocorrências, permite acompanhar sua gravidade e situação e oferece indicadores para auxiliar a triagem operacional.

## Demonstração online

- Vídeo de apresentação: https://www.youtube.com/watch?v=LVyTLheiAuM
- Aplicação: https://logos-8c71.onrender.com
- API (Swagger): https://logos-api-9utr.onrender.com/docs
- Health check: https://logos-api-9utr.onrender.com/health

O projeto está hospedado no Render, utilizando serviços gratuitos.
O backend pode levar alguns instantes para iniciar após
um período de inatividade.

### Credenciais de demonstração

E-mail: demo@logos.local
Senha: 123456789012

Os dados disponibilizados são fictícios e destinados
exclusivamente à avaliação técnica.

## Funcionalidades

- Copiloto conversacional com IA para consultar incidentes, analisar ocorrências e sugerir ações operacionais.
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
| Inteligência Artificial | OpenRouter, LLMs com tool calling e agente com ferramentas de consulta |
| Deploy | Render (Static Site, Web Service e PostgreSQL) |

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

## Logos AI — Copiloto de incidentes

O Logos AI é um assistente conversacional integrado ao dashboard,
desenvolvido para apoiar a triagem de incidentes logísticos.

A integração utiliza a API do OpenRouter e três ferramentas
de consulta somente leitura:

- `get_incident_stats`: consulta indicadores agregados.
- `list_incidents`: lista incidentes com filtros.
- `get_incident`: consulta os detalhes de uma ocorrência.

O agente não possui acesso direto ao banco de dados e não pode
cadastrar, alterar ou excluir incidentes.

O backend limita a quantidade de rodadas e chamadas de ferramentas
e trata erros de indisponibilidade e limites dos provedores.

O modelo principal e os fallbacks são configurados por variáveis
de ambiente:

- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `OPENROUTER_FALLBACK_MODELS`
- `OPENROUTER_TIMEOUT`

A funcionalidade depende da disponibilidade dos modelos
configurados e pode sofrer limitações no plano gratuito.

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
OPENROUTER_API_KEY=
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free
OPENROUTER_FALLBACK_MODELS=nvidia/nemotron-3.5-lightning:free,xingchen-agi/xing4.0-29b-a4b:free
OPENROUTER_TIMEOUT=60
```

> `COOKIE_SECURE=false` é exclusivo para desenvolvimento em HTTP. Em produção, utilize HTTPS e `COOKIE_SECURE=true`. Não versione o arquivo `.env`.
> A chave `OPENROUTER_API_KEY` é necessária apenas para utilizar o Logos AI.
> As funcionalidades de autenticação, gerenciamento de incidentes,
> filtros e dashboard continuam disponíveis sem essa integração.

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
| `POST` | `/ai/chat` | Conversar com o Logos AI |
| `POST` | `/ai/incidents/{id}/analyze` | Analisar um incidente |

Em atualizações e exclusões, a versão enviada deve corresponder à versão atual do registro. Caso contrário, a API responde com **409 Conflict**.

## Segurança

- Sessões JWT armazenadas em cookies `HttpOnly`.
- Em desenvolvimento HTTP: `SameSite=Lax`.
- Em produção HTTPS: `SameSite=None` e `Secure=true`,
  permitindo a comunicação entre frontend e backend
  em origens distintas.
- Token CSRF e validação de Origin nas operações de escrita.
- Política CORS restrita às origens autorizadas.

Em produção, frontend e backend utilizam domínios diferentes. A configuração de cookies permite requisições entre esses domínios, mas depende das políticas de cookies de terceiros do navegador. As operações de escrita permanecem protegidas por token CSRF e validação de origem.

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
