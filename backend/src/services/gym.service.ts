import * as repo from '../repositories/gym.repository';
import { HttpError } from '../errors/http-error';

// ---------- validações ----------
function text(v: any, label: string, max: number, required = true): string | null {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) {
    if (required) throw new HttpError(400, `${label} é obrigatório`);
    return null;
  }
  if (s.length > max) throw new HttpError(400, `${label} deve ter no máximo ${max} caracteres`);
  return s;
}

function num(v: any, label: string, min: number, max: number, integer = false): number {
  const n = Number(v);
  const empty = v === null || v === undefined || v === '';
  if (empty || !Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) {
    throw new HttpError(400, `${label} deve ser ${integer ? 'um inteiro' : 'um número'} entre ${min} e ${max}`);
  }
  return n;
}

function date(v: any, label: string): string | null {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || isNaN(Date.parse(v))) {
    throw new HttpError(400, `${label} deve estar no formato AAAA-MM-DD`);
  }
  return v;
}

function body(b: any): any {
  if (!b || typeof b !== 'object') throw new HttpError(400, 'Corpo da requisição inválido');
  return b;
}

// ---------- planos ----------
function parsePlan(raw: any) {
  const b = body(raw);
  if (b.active !== undefined && typeof b.active !== 'boolean') {
    throw new HttpError(400, 'active deve ser true ou false');
  }
  return {
    name: text(b.name, 'Nome', 60),
    price: num(b.price, 'Preço', 0, 100000),
    duration_months: num(b.duration_months, 'Duração (meses)', 1, 36, true),
    description: text(b.description, 'Descrição', 200, false),
    active: b.active === undefined ? true : b.active,
  };
}

export const listPlans = (onlyActive: boolean) => repo.listPlans(onlyActive);

export async function getPlan(id: number) {
  const plan = await repo.findPlan(id);
  if (!plan) throw new HttpError(404, 'Plano não encontrado');
  return plan;
}

export const createPlan = (b: any) => repo.createPlan(parsePlan(b));

export async function updatePlan(id: number, b: any) {
  const data = parsePlan(b);
  await getPlan(id);
  return repo.updatePlan(id, data);
}

export async function deletePlan(id: number) {
  await getPlan(id);
  await repo.removePlan(id); // se houver matrículas nesse plano, o banco recusa (409)
}

// ---------- matrículas ----------
const SITUATIONS = ['ativa', 'vencida', 'cancelada'];

export async function listMemberships(query: any) {
  const filters: { situation?: string; userId?: number } = {};
  if (query.situation !== undefined) {
    if (!SITUATIONS.includes(String(query.situation))) {
      throw new HttpError(400, `situation deve ser: ${SITUATIONS.join(', ')}`);
    }
    filters.situation = String(query.situation);
  }
  if (query.user_id !== undefined) filters.userId = num(query.user_id, 'user_id', 1, 2147483647, true);
  return repo.listMemberships(filters);
}

export async function expiring(query: any) {
  const days = query.days === undefined ? 7 : num(query.days, 'days', 1, 90, true);
  return repo.expiringMemberships(days);
}

export async function getMembership(id: number) {
  const m = await repo.findMembership(id);
  if (!m) throw new HttpError(404, 'Matrícula não encontrada');
  return m;
}

export async function createMembership(raw: any) {
  const b = body(raw);
  const userId = num(b.user_id, 'user_id', 1, 2147483647, true);
  const planId = num(b.plan_id, 'plan_id', 1, 2147483647, true);
  const start = date(b.start_date, 'start_date');

  if (!(await repo.userExists(userId))) throw new HttpError(404, 'Aluno não encontrado');
  const created = await repo.createMembership(userId, planId, start);
  if (!created) throw new HttpError(404, 'Plano não encontrado ou inativo');
  return repo.findMembership(created.id);
}

export async function cancelMembership(id: number) {
  const m = await getMembership(id);
  if (m.canceled_at) throw new HttpError(409, 'Matrícula já está cancelada');
  await repo.cancelMembership(id);
  return repo.findMembership(id);
}

// ---------- pagamentos ----------
const METHODS = ['pix', 'dinheiro', 'cartao', 'boleto'];

export async function listPayments(membershipId: number) {
  await getMembership(membershipId);
  return repo.listPayments(membershipId);
}

export async function payMembership(membershipId: number, raw: any) {
  const b = raw && typeof raw === 'object' ? raw : {};
  const method = b.method === undefined ? 'pix' : String(b.method);
  if (!METHODS.includes(method)) throw new HttpError(400, `method deve ser: ${METHODS.join(', ')}`);
  const amount = b.amount === undefined ? null : num(b.amount, 'amount', 0, 100000);

  const m = await getMembership(membershipId);
  if (m.canceled_at) throw new HttpError(409, 'Matrícula cancelada não aceita pagamento');

  const payment = await repo.pay(membershipId, method, amount);
  if (!payment) throw new HttpError(404, 'Matrícula não encontrada');
  return { payment, membership: await repo.findMembership(membershipId) };
}

// ---------- peso e altura ----------
async function requireUser(userId: number) {
  if (!(await repo.userExists(userId))) throw new HttpError(404, 'Aluno não encontrado');
}

export async function listMeasurements(userId: number) {
  await requireUser(userId);
  return repo.listMeasurements(userId);
}

export async function addMeasurement(userId: number, raw: any) {
  const b = body(raw);
  await requireUser(userId);
  return repo.addMeasurement(userId, {
    weight_kg: num(b.weight_kg, 'Peso (kg)', 20, 400),
    height_cm: num(b.height_cm, 'Altura (cm)', 100, 250),
    measured_at: date(b.measured_at, 'measured_at'),
    notes: text(b.notes, 'Observações', 200, false),
  });
}

export async function deleteMeasurement(id: number) {
  if (!(await repo.removeMeasurement(id))) throw new HttpError(404, 'Medição não encontrada');
}

// ---------- resumo ----------
export const summary = () => repo.summary();
