import { Request, Response } from 'express';
import * as userService from '../services/user.service';

export async function index(req: Request, res: Response): Promise<void> {
  const { name, status } = req.query;
  const filters: { name?: string; status?: boolean } = {};
  if (name) filters.name = String(name);
  if (status !== undefined) filters.status = status === 'true';

  const users = await userService.listUsers(filters);
  res.json(users);
}

export async function show(req: Request, res: Response): Promise<void> {
  const user = await userService.getUser(Number(req.params.id));
  res.json(user);
}

export async function store(req: Request, res: Response): Promise<void> {
  const user = await userService.createUser(req.body);
  res.status(201).json(user);
}

export async function update(req: Request, res: Response): Promise<void> {
  const user = await userService.updateUser(Number(req.params.id), req.body);
  res.json(user);
}

export async function patch(req: Request, res: Response): Promise<void> {
  const user = await userService.patchUser(Number(req.params.id), req.body);
  res.json(user);
}

export async function destroy(req: Request, res: Response): Promise<void> {
  await userService.deleteUser(Number(req.params.id));
  res.status(204).send();
}
