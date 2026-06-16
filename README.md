# Paz dos Pais

Plataforma de gestão de saúde familiar para cuidadores acompanharem a rotina médica de pacientes idosos — medicamentos, consultas, documentos e doses diárias, tudo em um só lugar.

---

## Funcionalidades

- **Painel** — visão geral do paciente com tarefas pendentes e próximas consultas
- **Medicamentos** — cadastro manual ou via foto com extração por IA (Google Gemini)
- **Doses diárias** — registro de adesão (tomou / não tomou / pulou) com histórico
- **Consultas** — agendamento e acompanhamento por especialidade
- **Documentos** — upload de exames, receitas e laudos com resumo gerado por IA
- **Paciente** — perfil com dados demográficos, alergias, alertas e anotações
- **Compartilhar** — página pública temporária (link + QR code) para acesso do médico
- **Multi-paciente** — um cuidador pode gerenciar vários pacientes com papéis distintos (OWNER / CAREGIVER / VIEWER)

---

## Stack

| Camada         | Tecnologias                                                                |
| -------------- | -------------------------------------------------------------------------- |
| Frontend       | React 19, Vite, Tailwind CSS 4, shadcn/ui, React Router v7, TanStack Query |
| Backend        | Node.js, Express, Prisma ORM                                               |
| Banco de dados | MySQL / MariaDB                                                            |
| Autenticação   | JWT, bcryptjs, Google OAuth                                                |
| Armazenamento  | Cloudflare R2 (S3-compatible)                                              |
| IA / OCR       | Google Gemini 1.5 Flash                                                    |
| E-mail         | Resend                                                                     |
| Agendamento    | node-cron (lembretes de medicamentos)                                      |

---

## Pré-requisitos

- Node.js ≥ 20
- MySQL / MariaDB em execução
- Contas nos serviços externos (ver variáveis de ambiente abaixo)

---

## Configuração

### Variáveis de ambiente

Crie um arquivo `.env` dentro de `server/` com:

```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/paz_dos_pais"
JWT_SECRET="sua-chave-secreta"

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_URL=

# E-mail
RESEND_API_KEY=
EMAIL_FROM="Paz dos Pais <no-reply@seudominio.com>"

# Google Gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Agendador de lembretes
ENABLE_SCHEDULER=true
TZ=America/Sao_Paulo

PORT=3000
```

Crie um arquivo `.env` dentro de `client/` com:

```env
VITE_API_URL=http://localhost:3000
```

---

## Instalação e execução

```bash
# Instalar dependências
cd server && npm install
cd ../client && npm install

# Configurar banco de dados
cd server
npm run db:migrate    # aplica as migrations
npm run db:generate   # gera o Prisma Client
```

### Desenvolvimento

```bash
# Terminal 1 — backend (porta 3000)
cd server && npm run dev

# Terminal 2 — frontend (porta 5173)
cd client && npm run dev
```

### Produção

```bash
cd server && npm start
cd client && npm run build   # gera dist/
```

---

## Scripts úteis

| Diretório | Comando               | Descrição                        |
| --------- | --------------------- | -------------------------------- |
| `server`  | `npm run dev`         | Inicia o servidor com watch      |
| `server`  | `npm run db:migrate`  | Aplica migrations Prisma         |
| `server`  | `npm run db:generate` | Gera Prisma Client               |
| `server`  | `npm run db:studio`   | Abre o Prisma Studio (GUI)       |
| `server`  | `npm run db:push`     | Sincroniza schema sem migrations |
| `client`  | `npm run dev`         | Inicia o Vite dev server         |
| `client`  | `npm run build`       | Build de produção                |
| `client`  | `npm run lint`        | Lint do código                   |

---

## Estrutura do projeto

```
paz-dos-pais/
├── client/               # Frontend React
│   └── src/
│       ├── components/   # Componentes reutilizáveis e layout
│       ├── context/      # AuthContext, PatientContext, ThemeContext
│       ├── pages/        # Uma pasta por rota
│       └── services/     # Chamadas à API (Axios)
└── server/               # Backend Express
    ├── prisma/
│   │   ├── schema.prisma
    │   └── migrations/
    └── src/
        ├── routes/       # Endpoints da API
        ├── middleware/    # Auth JWT e permissões
        └── services/     # Lógica de negócio (IA, e-mail, R2)
```

---

## Modelo de dados

```
Users ──< Permissions >── Patients
                              │
              ┌───────────────┼───────────────┐
              │               │               │
         Appointments   Medications      Documents
                              │
                        MedicationLogs

Patients ──< ShareTokens
```

- **Permissions** — liga usuários a pacientes com papel (OWNER / CAREGIVER / VIEWER)
- **ShareTokens** — tokens temporários de acesso público para médicos

---

## Licença

Projeto privado — todos os direitos reservados.
