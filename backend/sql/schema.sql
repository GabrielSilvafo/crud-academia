-- Silvas Gym: todas as tabelas do projeto, em um arquivo só.
-- Rode UMA vez, num projeto Supabase novo (SQL Editor -> New query -> Run).

-- Alunos (tabela da base do professor)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  age INT,
  status BOOLEAN,
  create_at TIMESTAMP DEFAULT NOW()
);

-- Planos (Mensal, Trimestral, Anual...)
CREATE TABLE plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(60) UNIQUE NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  duration_months INT NOT NULL CHECK (duration_months > 0),
  description VARCHAR(200),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Matrículas: ligam um aluno a um plano e guardam o vencimento
CREATE TABLE memberships (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id INT NOT NULL REFERENCES plans(id),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  canceled_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Um aluno só pode ter uma matrícula ativa por vez
CREATE UNIQUE INDEX one_active_membership ON memberships (user_id) WHERE canceled_at IS NULL;
CREATE INDEX memberships_due_date_idx ON memberships (due_date);

-- Pagamentos de cada matrícula
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  membership_id INT NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  method VARCHAR(20) NOT NULL DEFAULT 'pix',
  paid_at TIMESTAMP NOT NULL DEFAULT NOW(),
  period_end DATE NOT NULL
);

-- Peso e altura (histórico de cada aluno)
CREATE TABLE measurements (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weight_kg NUMERIC(5,2) NOT NULL CHECK (weight_kg > 0 AND weight_kg < 500),
  height_cm NUMERIC(5,1) NOT NULL CHECK (height_cm > 50 AND height_cm < 260),
  measured_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes VARCHAR(200)
);
CREATE INDEX measurements_user_idx ON measurements (user_id, measured_at);

-- Exercícios de cada aluno
CREATE TABLE exercises (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout VARCHAR(30) NOT NULL DEFAULT 'Treino A',
  name VARCHAR(100) NOT NULL,
  sets INT CHECK (sets > 0 AND sets <= 50),
  reps VARCHAR(20),
  notes VARCHAR(200),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX exercises_user_idx ON exercises (user_id, workout, id);

-- Planos iniciais (pode mudar os valores depois)
INSERT INTO plans (name, price, duration_months, description) VALUES
  ('Mensal', 99.90, 1, 'Acesso livre por 1 mês'),
  ('Trimestral', 269.90, 3, 'Acesso livre por 3 meses'),
  ('Anual', 899.90, 12, 'Acesso livre por 12 meses');

-- Segurança: bloqueia o acesso pela API pública do Supabase.
-- O backend conecta direto no Postgres e não é afetado.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;