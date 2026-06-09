# Paz dos Pais — Contexto do Projeto

## O que é

App web de acompanhamento médico familiar. O problema central: idosos com múltiplos médicos e especialidades acumulam medicamentos, exames e consultas sem nenhuma centralização — e quando vão a um médico novo, não sabem informar o histórico. Filhos e cuidadores perdem tempo gerenciando isso de forma fragmentada.

A solução é um hub familiar onde o filho opera o sistema, o idoso consome passivamente, e o médico acessa um resumo limpo via QR code temporário.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| ORM | Prisma |
| Banco | MariaDB |
| Storage | DigitalOcean (Spaces) ou Azure (Blob Storage) - plano de estudante gratuito |
| E-mail | Resend |
| LLM / OCR | Gemini 1.5 Flash via Google AI Studio (extração de dados de receitas e laudos via visão) |
| Linguagem | JavaScript (sem TypeScript) |

---

## Personas

- **Filho / cuidador** — usuário principal. Opera o sistema, cadastra dados, recebe notificações.
- **Paciente (idoso)** — não precisa de login. Visualiza o painel pessoal de forma passiva, confirma tomada de remédio.
- **Médico** — acesso pontual via QR code temporário. Não tem conta no sistema.

---

## Features

### 1. Gestão de contas e acessos
- Autenticação via e-mail/senha ou Google OAuth
- Perfis de pacientes sem necessidade de login próprio
- Tabela `Permissions` une `Users` ↔ `Patients` com roles: `OWNER`, `CAREGIVER`, `VIEWER`

### 2. Linha do tempo de consultas
- Estados: `SCHEDULED` (futuras, geram lembretes), `COMPLETED` (realizadas), `CANCELED`
- Campos: médico, especialidade, data/hora, notas livres
- Vínculo opcional com medicamentos e documentos originados na consulta

### 3. Gestão e monitoramento de medicamentos
- Cadastro manual ou via foto de receita (OCR + LLM)
- Campo `source`: `AI_EXTRACTION` ou `MANUAL`
- Dados extraídos por IA ficam pendentes de confirmação humana antes de salvar
- `isActive` para distinguir uso contínuo de tratamentos temporários
- `MedicationLogs`: histórico diário com status `TAKEN`, `MISSED`, `SKIPPED`
- Lembretes por e-mail agendados nos horários das doses

### 4. Repositório de documentos e notas
- Upload de laudos, exames e receitas — associados ou não a uma consulta
- Arquivo armazenado no R2; apenas a URL salva no banco
- Extração de dados por LLM (mesmo fluxo dos medicamentos)
- Campo `source` com mesma lógica de confirmação humana
- Campo `notes` na tabela `Patients` para anotações livres do cuidador

### 5. Módulo médico — portabilidade
- Geração de token temporário com `expiresAt` (padrão: 24h) e `accessCount`
- Token UUID v4 — único mecanismo de acesso, página pública sem autenticação
- One-pager limpo exibindo: alergias/alertas, medicamentos ativos, últimos documentos

### 6. Notificações
- Por e-mail via Resend (MVP)
- Casos de uso: lembrete de dose, alerta de consulta agendada
- Possibilidade futura de evoluir para PWA com push notifications

---

## Modelo de dados

```
Users
  id, name, email, passwordHash, createdAt

Patients
  id, name, birthDate, allergies, alerts, notes, createdAt

Permissions  ← tabela pivô Users ↔ Patients
  id, userId (FK), patientId (FK), role (OWNER | CAREGIVER | VIEWER)

Appointments
  id, patientId (FK), doctorName, specialty, dateTime,
  status (SCHEDULED | COMPLETED | CANCELED), notes

Medications
  id, patientId (FK), appointmentId (FK, nullable),
  name, dosage, frequency, startDate, endDate,
  isActive, source (AI_EXTRACTION | MANUAL), receiptUrl

MedicationLogs
  id, medicationId (FK), scheduledFor, takenAt,
  status (TAKEN | MISSED | SKIPPED)

Documents
  id, patientId (FK), appointmentId (FK, nullable),
  title, fileUrl, aiSummary, source (AI_EXTRACTION | MANUAL), createdAt

ShareTokens
  id, patientId (FK), token (UUID v4), expiresAt, accessCount
```

---

## Estrutura de pastas

```
paz-dos-pais/
├── client/                        # Frontend React + Vite + Tailwind
│   └── src/
│       ├── components/            # Componentes reutilizáveis
│       ├── pages/
│       │   ├── dashboard/
│       │   ├── medications/
│       │   ├── appointments/
│       │   ├── documents/
│       │   └── share/             # Página pública do QR code
│       ├── hooks/
│       ├── services/              # Chamadas à API
│       ├── context/               # AuthContext, PatientContext
│       └── types/
│
└── server/                        # Backend Node + Express + Prisma
    ├── src/
    │   ├── routes/
    │   │   ├── auth.routes.js
    │   │   ├── patients.routes.js
    │   │   ├── medications.routes.js
    │   │   ├── appointments.routes.js
    │   │   ├── documents.routes.js
    │   │   └── share.routes.js    # Rota pública — sem autenticação
    │   ├── controllers/
    │   ├── services/
    │   │   ├── ai.service.js      # Chamada OpenAI / OCR
    │   │   ├── email.service.js   # Resend
    │   │   └── storage.service.js # Upload Cloudflare R2
    │   ├── middlewares/
    │   │   ├── auth.middleware.js       # Verifica JWT
    │   │   └── permission.middleware.js # Verifica role do usuário no paciente
    │   ├── lib/
    │   │   ├── prisma.js          # Instância singleton do Prisma
    │   │   └── r2.js              # Cliente S3 apontando para o R2
    │   ├── app.js                 # Setup do Express
    │   └── server.js              # Porta e listen
    └── prisma/
        ├── schema.prisma
        └── migrations/
```

---

## Decisões de arquitetura

**`permission.middleware.js`** deve ser aplicado em todas as rotas que recebem `patientId`. Ele verifica se o usuário autenticado tem uma entrada em `Permissions` para aquele paciente. É o guarda central de acesso — não pode ser esquecido em nenhum endpoint sensível.

**`share.routes.js`** é a única rota verdadeiramente pública. Recebe o token na URL, valida `expiresAt` e `accessCount`, e devolve o resumo do paciente. Não passa pelo `auth.middleware.js`.

**`appointmentId` é nullable** em `Medications` e `Documents` — medicamentos de automedicação e documentos avulsos não precisam estar vinculados a uma consulta.

**Dados extraídos por IA nunca são salvos diretamente.** O fluxo é: extração → frontend exibe para revisão → usuário confirma → POST salva. Isso evita erros silenciosos em receitas mal escritas.

**Storage:** arquivos são enviados ao Cloudflare R2 via `storage.service.js`. O banco guarda apenas a URL pública do arquivo. O SDK usado é `@aws-sdk/client-s3` configurado com o endpoint do R2.

---

## Observações para desenvolvimento

- Começar pelo scaffold: `client/` com Vite + React + Tailwind, `server/` com Express + Prisma
- Gerar o `schema.prisma` antes de qualquer rota — as migrations definem o contrato do banco
- Implementar auth e o `permission.middleware` antes de qualquer feature de dados
- Deixar o módulo de OCR/LLM para depois do CRUD básico estar funcionando
- O módulo de share (QR code) pode ser desenvolvido de forma independente assim que o modelo de dados estiver estável
