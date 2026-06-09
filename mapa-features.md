# App de Saúde Familiar — Mapa de Features
> Nome do app em aberto. Documento de referência para o pontapé inicial do projeto.

---

## 1. Gestão de Contas e Acessos

- **Cadastro de usuários:** autenticação simples via e-mail/senha ou Google OAuth.
- **Perfis de pacientes:** criação de perfis para os idosos, sem necessidade de e-mail ou senha próprios.
- **Vínculos familiares:** tabela intermediária (`Permissions`) que une `Users` ➡️ `Patients` com a respectiva `role`:
  - `OWNER` — controle total
  - `CAREGIVER` — pode editar
  - `VIEWER` — somente leitura

---

## 2. Linha de Tempo de Consultas

- **Estados da consulta:**
  - `SCHEDULED` — consultas futuras; geram lembretes.
  - `COMPLETED` — consultas realizadas; compõem o histórico.
  - `CANCELED` — consultas canceladas.
- Campos: médico, especialidade, data/hora, notas livres e vínculo opcional com documentos e medicamentos originados na consulta.

---

## 3. Gestão e Monitoramento de Medicamentos

- **Cadastro inteligente:** input manual ou via foto da receita processada por LLM com visão computacional (OCR + IA).
- **Rastreabilidade:** campo `source` identifica a origem do dado (`AI_EXTRACTION` ou `MANUAL`).
- **Confirmação humana:** dados extraídos por IA ficam pendentes de revisão pelo cuidador antes de serem salvos definitivamente.
- **Campos de controle:** nome, dosagem, frequência, horários, data de início/fim e `isActive` (permite desativar remédios temporários, como antibióticos, sem excluir o histórico).
- **Logs de adesão (`MedicationLogs`):** registro diário com status `TAKEN`, `MISSED` ou `SKIPPED`, e campos `scheduledFor` / `takenAt`.
- **Alertas:** agendamento de lembretes por e-mail nos horários das doses (ver seção 6).

---

## 4. Repositório de Documentos e Notas

- **Documentos:** upload de laudos, exames e receitas — associados ou não a uma consulta. O arquivo é armazenado na nuvem; apenas a URL é salva no banco.
- **Extração por IA:** laudos e exames podem ser processados por LLM (OCR + IA) para transcrição dos dados relevantes.
- **Rastreabilidade:** campo `source` identifica a origem (`AI_EXTRACTION` ou `MANUAL`), com mesma lógica de confirmação humana aplicada aos medicamentos.
- **Observações livres:** campo de texto na tabela `Patients` para anotações rápidas do dia a dia sobre o paciente.

---

## 5. Módulo Médico (Portabilidade)

- **Gerador de links seguros:** criação de tokens temporários com:
  - `expiresAt` — expiração curta (24h por padrão).
  - `accessCount` — limite de aberturas como camada extra de segurança.
  - Token longo (UUID v4) como único mecanismo de acesso — página pública, sem autenticação.
- **Página do QR code:** one-pager ultra-limpo, acessível via link/QR code, exibindo o resumo essencial do paciente:
  - Alergias e alertas fixos.
  - Medicamentos ativos.
  - Últimos exames/laudos registrados.

---

## 6. Notificações

- Implementação inicial via **e-mail** (ex: Nodemailer + Resend), priorizando simplicidade.
- Casos de uso: lembretes de doses, alertas de consultas agendadas.
- O sistema será primariamente um **web app**, com possibilidade de evolução para PWA futuramente.
