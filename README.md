# Silvas Gym

Sistema de gestão de academia feito sobre a base do CRUD de usuários da disciplina.
**Angular** (telas) + **Node.js/Express/TypeScript** (API) + **Supabase/PostgreSQL** (banco).

O CRUD de usuários original foi mantido sem alterações. Tudo da academia foi **adicionado** em arquivos e tabelas novas.

## O que o sistema faz

| Tela | O que faz |
|---|---|
| **Usuários** | Cadastro, edição, exclusão e busca de alunos (base do professor) |
| **Matrículas** | Matricula um aluno em um plano, mostra o vencimento e a situação (ativa, vencida, cancelada), registra pagamento e cancela |
| **Planos** | Lista os planos, permite ativar, desativar e excluir |
| **Exercícios** | Escreve os exercícios de cada aluno, separados por treino (A, B, C...), com séries e repetições |
| **Peso e altura** | Histórico de medidas de cada aluno, com IMC calculado e variação de peso |

### Regras de negócio
- O **vencimento** é calculado sozinho: data de início + duração do plano.
- Um aluno só pode ter **uma matrícula ativa** por vez.
- **Pagar** registra o pagamento e empurra o vencimento. Se a matrícula já venceu, a contagem recomeça de hoje; se está em dia, soma ao vencimento atual.
- A situação **vencida** é calculada pela data, sem precisar de rotina agendada.
- Plano que já tem matrículas **não pode ser excluído** (o banco protege o histórico). Use **Desativar**: ele some da lista de matrícula, mas o histórico continua.
- **IMC** = peso (kg) / altura (m)².

## Como funciona

```
Angular (localhost:4200)  ->  API Express (localhost:3000)  ->  Supabase (PostgreSQL)
```

No backend, cada requisição passa por camadas, como na base do professor:

```
routes  ->  controller  ->  service  ->  repository  ->  banco
```

- **routes**: liga cada endereço a uma função.
- **controller**: lê a requisição e devolve a resposta HTTP.
- **service**: regras e validações (nome obrigatório, e-mail válido etc.).
- **repository**: único lugar com SQL.

Erros voltam com o status certo: `400` dado inválido, `404` não encontrado, `409` conflito (e-mail repetido, plano em uso).

## Estrutura

```
backend/
  sql/schema.sql              todas as tabelas (rodar uma vez no Supabase)
  .env.example                modelo da conexão com o banco
  src/
    app.ts                    monta o Express e as rotas
    routes/                   user.routes (professor), gym.routes, exercise.routes
    controllers/ services/ repositories/
    errors/http-error.ts      tratamento de erros
frontend/
  src/app/
    components/               telas (user-list, user-form, membership-list, plans, exercises, measurements)
    services/                 user.service (professor) e gym.service
    models/ shared/
```

## Como rodar

### Pré-requisitos
Git, Node.js 18 ou superior e Angular CLI (`npm install -g @angular/cli`).

### 1. Clonar
```
git clone https://github.com/GabrielSilvafo/crud-academia.git
cd crud-academia
```

### 2. Criar o banco no Supabase
1. Crie um projeto gratuito em [supabase.com](https://supabase.com) e anote a senha do banco.
2. No painel, abra **SQL Editor -> New query**, cole o conteúdo de `backend/sql/schema.sql` e clique em **Run**.
3. Confira no **Table Editor**: devem existir `users`, `plans`, `memberships`, `payments`, `measurements` e `exercises` (os planos Mensal, Trimestral e Anual já vêm cadastrados).
4. Clique em **Connect** (topo da tela), escolha **Session pooler** e copie a string de conexão.

> Use o **Session pooler**. A conexão direta do Supabase usa só IPv6, e muitas redes não alcançam. Se a conexão falhar, teste em outra rede (por exemplo, o hotspot do celular): algumas redes, como as de faculdades, bloqueiam a porta do banco.

### 3. Backend
```
cd backend
npm install
copy .env.example .env        (Mac/Linux: cp .env.example .env)
```
Abra o `.env` e cole a string de conexão no lugar de `DATABASE_URL`, trocando `[YOUR-PASSWORD]` pela senha (sem colchetes). Depois:
```
npm run dev
```
Deve aparecer `Servidor rodando na porta 3000`. Teste em `http://localhost:3000/api/plans`: devem aparecer os 3 planos.

### 4. Frontend (em outro terminal)
```
cd frontend
npm install
ng serve
```
Abra `http://localhost:4200`. O backend precisa continuar rodando.

> O `.env` nunca vai para o Git (está no `.gitignore`): cada pessoa usa o seu próprio banco.

## Endpoints da API

Prefixo `/api`.

| Recurso | Rotas |
|---|---|
| Usuários | `GET/POST /users`, `GET/PUT/PATCH/DELETE /users/:id` |
| Planos | `GET /plans` (`?active=true`), `GET/PUT/DELETE /plans/:id`, `POST /plans` |
| Matrículas | `GET /memberships` (`?situation=ativa\|vencida\|cancelada&user_id=`), `GET /memberships/expiring?days=7`, `GET /memberships/:id`, `POST /memberships`, `POST /memberships/:id/cancel` |
| Pagamentos | `GET/POST /memberships/:id/payments` (`method`: pix, dinheiro, cartao, boleto) |
| Peso e altura | `GET/POST /users/:id/measurements`, `DELETE /measurements/:id` |
| Exercícios | `GET/POST /users/:id/exercises`, `DELETE /exercises/:id` |
| Resumo | `GET /gym/summary` (alunos ativos, em atraso, vencendo em 7 dias, faturamento do mês) |

Exemplo, matricular o aluno 1 no plano 1:
```
curl -X POST http://localhost:3000/api/memberships -H "Content-Type: application/json" -d "{\"user_id\":1,\"plan_id\":1}"
```

Ainda sem tela: criar plano novo e o resumo (`/gym/summary`), disponíveis pela API.

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| `ENOTFOUND` ou `AggregateError` no backend | Rede sem acesso ao banco ou string errada. Use o Session pooler e teste em outra rede |
| `relation "users" does not exist` | O `schema.sql` não foi rodado nesse projeto Supabase |
| `localhost:3000` recusa a conexão | O backend não está rodando |
| Telas abrem, mas listas ficam vazias ou o Salvar não faz nada | Backend parado ou sem conexão com o banco: veja o terminal dele |
| `ts-node-dev` não reconhecido | Dentro de `backend/`: `npm install -D typescript ts-node-dev @types/node @types/express @types/cors @types/pg` |
| Porta 3000 ou 4200 em uso | Feche o terminal antigo antes de subir de novo |
| `ng serve` mostra erro e o site não muda | Erro de compilação: o `ng serve` mantém a versão antiga no ar. Leia o terminal |
