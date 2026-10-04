import { Router } from 'express';
import pool from '../config/database';
import { handle, parseId, HttpError } from '../errors/http-error';

// Exercícios de cada aluno (rotas + validação + SQL num arquivo só, para ficar curto)
const router = Router();
const COLS = 'id, user_id, workout, name, sets, reps, notes';

function text(v: any, label: string, max: number, required = false): string | null {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) {
    if (required) throw new HttpError(400, `${label} é obrigatório`);
    return null;
  }
  if (s.length > max) throw new HttpError(400, `${label} deve ter no máximo ${max} caracteres`);
  return s;
}

async function requireUser(userId: number): Promise<void> {
  const r = await pool.query('SELECT 1 FROM users WHERE id = $1', [userId]);
  if ((r.rowCount ?? 0) === 0) throw new HttpError(404, 'Aluno não encontrado');
}

router.get(
  '/users/:id/exercises',
  handle(async (req, res) => {
    const userId = parseId(req.params.id);
    await requireUser(userId);
    const r = await pool.query(`SELECT ${COLS} FROM exercises WHERE user_id = $1 ORDER BY workout, id`, [userId]);
    res.json(r.rows);
  })
);

router.post(
  '/users/:id/exercises',
  handle(async (req, res) => {
    const userId = parseId(req.params.id);
    const b = req.body && typeof req.body === 'object' ? req.body : {};
    const name = text(b.name, 'Exercício', 100, true);
    const workout = text(b.workout, 'Treino', 30) ?? 'Treino A';
    const reps = text(b.reps, 'Repetições', 20);
    const notes = text(b.notes, 'Observação', 200);

    let sets: number | null = null;
    if (b.sets !== undefined && b.sets !== null && b.sets !== '') {
      sets = Number(b.sets);
      if (!Number.isInteger(sets) || sets < 1 || sets > 50) {
        throw new HttpError(400, 'Séries deve ser um inteiro entre 1 e 50');
      }
    }

    await requireUser(userId);
    const r = await pool.query(
      `INSERT INTO exercises (user_id, workout, name, sets, reps, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${COLS}`,
      [userId, workout, name, sets, reps, notes]
    );
    res.status(201).json(r.rows[0]);
  })
);

router.delete(
  '/exercises/:id',
  handle(async (req, res) => {
    const r = await pool.query('DELETE FROM exercises WHERE id = $1', [parseId(req.params.id)]);
    if ((r.rowCount ?? 0) === 0) throw new HttpError(404, 'Exercício não encontrado');
    res.status(204).send();
  })
);

export default router;