import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import { HttpError } from '../errors/http-error';

type Handler = (req: Request, res: Response) => Promise<void>;

// Envolve cada função: qualquer erro vira uma resposta HTTP em vez de travar a requisição
const handle =
  (fn: Handler): Handler =>
  async (req, res) => {
    try {
      await fn(req, res);
    } catch (err: any) {
      if (err instanceof HttpError) {
        res.status(err.status).json({ error: err.message });
      } else if (err?.code === '23505') {
        res.status(409).json({ error: 'Este e-mail já está cadastrado' });
      } else {
        console.error(err);
        res.status(500).json({ error: 'Erro interno no servidor' });
      }
    }
  };

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'Id inválido');
  }
  return id;
}

export const index = handle(async (req, res) => {
  const { name, status } = req.query;
  const filters: { name?: string; status?: boolean } = {};
  if (name) filters.name = String(name);
  if (status !== undefined) filters.status = status === 'true';

  const users = await userService.listUsers(filters);
  res.json(users);
});

export const show = handle(async (req, res) => {
  const user = await userService.getUser(parseId(req.params.id));
  res.json(user);
});

export const store = handle(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json(user);
});

export const update = handle(async (req, res) => {
  const user = await userService.updateUser(parseId(req.params.id), req.body);
  res.json(user);
});

export const patch = handle(async (req, res) => {
  const user = await userService.patchUser(parseId(req.params.id), req.body);
  res.json(user);
});

export const destroy = handle(async (req, res) => {
  await userService.deleteUser(parseId(req.params.id));
  res.status(204).send();
});