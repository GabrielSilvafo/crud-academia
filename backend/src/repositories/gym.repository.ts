import pool from '../config/database';

// ---------- alunos (só checagem de existência) ----------
export async function userExists(id: number): Promise<boolean> {
  const r = await pool.query('SELECT 1 FROM users WHERE id = $1', [id]);
  return (r.rowCount ?? 0) > 0;
}

// ---------- planos ----------
const PLAN_COLS = 'id, name, price::float8 AS price, duration_months, description, active';

export async function listPlans(onlyActive = false) {
  const r = await pool.query(
    `SELECT ${PLAN_COLS} FROM plans ${onlyActive ? 'WHERE active' : ''} ORDER BY duration_months, id`
  );
  return r.rows;
}

export async function findPlan(id: number) {
  const r = await pool.query(`SELECT ${PLAN_COLS} FROM plans WHERE id = $1`, [id]);
  return r.rows[0];
}

export async function createPlan(d: any) {
  const r = await pool.query(
    `INSERT INTO plans (name, price, duration_months, description, active)
     VALUES ($1, $2, $3, $4, $5) RETURNING ${PLAN_COLS}`,
    [d.name, d.price, d.duration_months, d.description, d.active]
  );
  return r.rows[0];
}

export async function updatePlan(id: number, d: any) {
  const r = await pool.query(
    `UPDATE plans SET name=$1, price=$2, duration_months=$3, description=$4, active=$5
     WHERE id=$6 RETURNING ${PLAN_COLS}`,
    [d.name, d.price, d.duration_months, d.description, d.active, id]
  );
  return r.rows[0];
}

export async function removePlan(id: number) {
  await pool.query('DELETE FROM plans WHERE id = $1', [id]);
}

// ---------- matrículas ----------
// "situation" é calculada na hora: cancelada, vencida (passou do vencimento) ou ativa
const MEMBERSHIP_SELECT = `
  SELECT m.id, m.user_id, u.name AS user_name, m.plan_id, p.name AS plan_name,
         p.price::float8 AS price,
         to_char(m.start_date, 'YYYY-MM-DD') AS start_date,
         to_char(m.due_date, 'YYYY-MM-DD') AS due_date,
         m.canceled_at,
         CASE WHEN m.canceled_at IS NOT NULL THEN 'cancelada'
              WHEN m.due_date < CURRENT_DATE THEN 'vencida'
              ELSE 'ativa' END AS situation,
         (m.due_date - CURRENT_DATE) AS days_to_due
  FROM memberships m
  JOIN users u ON u.id = m.user_id
  JOIN plans p ON p.id = m.plan_id`;

export async function listMemberships(filters: { situation?: string; userId?: number }) {
  const values: unknown[] = [];
  let query = `SELECT * FROM (${MEMBERSHIP_SELECT}) t WHERE 1=1`;
  if (filters.situation) {
    values.push(filters.situation);
    query += ` AND situation = $${values.length}`;
  }
  if (filters.userId) {
    values.push(filters.userId);
    query += ` AND user_id = $${values.length}`;
  }
  query += ' ORDER BY due_date, id';
  const r = await pool.query(query, values);
  return r.rows;
}

export async function expiringMemberships(days: number) {
  const r = await pool.query(
    `SELECT * FROM (${MEMBERSHIP_SELECT}) t
     WHERE situation = 'ativa' AND days_to_due <= $1
     ORDER BY due_date, id`,
    [days]
  );
  return r.rows;
}

export async function findMembership(id: number) {
  const r = await pool.query(`SELECT * FROM (${MEMBERSHIP_SELECT}) t WHERE id = $1`, [id]);
  return r.rows[0];
}

// Calcula o vencimento no banco: início + duração do plano. Só cria se o plano existir e estiver ativo.
export async function createMembership(userId: number, planId: number, startDate: string | null) {
  const r = await pool.query(
    `INSERT INTO memberships (user_id, plan_id, start_date, due_date)
     SELECT $1, p.id, COALESCE($3::date, CURRENT_DATE),
            (COALESCE($3::date, CURRENT_DATE) + make_interval(months => p.duration_months))::date
     FROM plans p WHERE p.id = $2 AND p.active
     RETURNING id`,
    [userId, planId, startDate]
  );
  return r.rows[0];
}

export async function cancelMembership(id: number) {
  await pool.query('UPDATE memberships SET canceled_at = NOW() WHERE id = $1 AND canceled_at IS NULL', [id]);
}

// ---------- pagamentos ----------
export async function listPayments(membershipId: number) {
  const r = await pool.query(
    `SELECT id, membership_id, amount::float8 AS amount, method, paid_at,
            to_char(period_end, 'YYYY-MM-DD') AS period_end
     FROM payments WHERE membership_id = $1 ORDER BY paid_at DESC, id DESC`,
    [membershipId]
  );
  return r.rows;
}

// Registra o pagamento e empurra o vencimento (tudo ou nada, numa transação).
// Se já venceu, a contagem recomeça de hoje; se ainda está em dia, soma ao vencimento atual.
export async function pay(membershipId: number, method: string, amount: number | null) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const m = await client.query(
      `SELECT p.price::float8 AS price, p.duration_months
       FROM memberships m JOIN plans p ON p.id = m.plan_id
       WHERE m.id = $1 FOR UPDATE OF m`,
      [membershipId]
    );
    const row = m.rows[0];
    if (!row) {
      await client.query('ROLLBACK');
      return null;
    }
    await client.query(
      `UPDATE memberships
       SET due_date = (GREATEST(due_date, CURRENT_DATE) + make_interval(months => $2))::date
       WHERE id = $1`,
      [membershipId, row.duration_months]
    );
    const p = await client.query(
      `INSERT INTO payments (membership_id, amount, method, period_end)
       VALUES ($1, $2, $3, (SELECT due_date FROM memberships WHERE id = $1))
       RETURNING id, membership_id, amount::float8 AS amount, method, paid_at,
                 to_char(period_end, 'YYYY-MM-DD') AS period_end`,
      [membershipId, amount ?? row.price, method]
    );
    await client.query('COMMIT');
    return p.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ---------- peso e altura ----------
const MEASUREMENT_COLS = `id, user_id, weight_kg::float8 AS weight_kg, height_cm::float8 AS height_cm,
  to_char(measured_at, 'YYYY-MM-DD') AS measured_at, notes,
  ROUND((weight_kg / ((height_cm / 100) ^ 2))::numeric, 2)::float8 AS imc`;

export async function listMeasurements(userId: number) {
  const r = await pool.query(
    `SELECT ${MEASUREMENT_COLS} FROM measurements WHERE user_id = $1 ORDER BY measured_at DESC, id DESC`,
    [userId]
  );
  return r.rows;
}

export async function addMeasurement(userId: number, d: any) {
  const r = await pool.query(
    `INSERT INTO measurements (user_id, weight_kg, height_cm, measured_at, notes)
     VALUES ($1, $2, $3, COALESCE($4::date, CURRENT_DATE), $5) RETURNING ${MEASUREMENT_COLS}`,
    [userId, d.weight_kg, d.height_cm, d.measured_at, d.notes]
  );
  return r.rows[0];
}

export async function removeMeasurement(id: number) {
  const r = await pool.query('DELETE FROM measurements WHERE id = $1', [id]);
  return (r.rowCount ?? 0) > 0;
}

// ---------- resumo ----------
export async function summary() {
  const r = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM memberships WHERE canceled_at IS NULL AND due_date >= CURRENT_DATE)::int AS active_members,
      (SELECT COUNT(*) FROM memberships WHERE canceled_at IS NULL AND due_date < CURRENT_DATE)::int AS overdue,
      (SELECT COUNT(*) FROM memberships WHERE canceled_at IS NULL
         AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7)::int AS expiring_7_days,
      COALESCE((SELECT SUM(amount) FROM payments
         WHERE date_trunc('month', paid_at) = date_trunc('month', NOW())), 0)::float8 AS revenue_month
  `);
  return r.rows[0];
}
