import * as userRepository from '../repositories/user.repository';
import { User, UserFilters, CreateUserDTO } from '../types/user';
import { HttpError } from '../errors/http-error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Valida e limpa os dados recebidos. partial = true é usado no PATCH (só valida o que veio).
function validate(body: any, partial: boolean): Partial<CreateUserDTO> {
  if (!body || typeof body !== 'object') {
    throw new HttpError(400, 'Corpo da requisição inválido');
  }

  const out: any = {};

  if (!partial || 'name' in body) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) throw new HttpError(400, 'Nome é obrigatório');
    if (name.length > 100) throw new HttpError(400, 'Nome deve ter no máximo 100 caracteres');
    out.name = name;
  }

  if (!partial || 'email' in body) {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email) throw new HttpError(400, 'E-mail é obrigatório');
    if (email.length > 100) throw new HttpError(400, 'E-mail deve ter no máximo 100 caracteres');
    if (!EMAIL_RE.test(email)) throw new HttpError(400, 'E-mail inválido');
    out.email = email;
  }

  if ('age' in body) {
    if (body.age === null || body.age === '') {
      out.age = null;
    } else {
      const age = Number(body.age);
      if (!Number.isInteger(age) || age < 0 || age > 120) {
        throw new HttpError(400, 'Idade deve ser um número inteiro entre 0 e 120');
      }
      out.age = age;
    }
  } else if (!partial) {
    out.age = null;
  }

  if ('status' in body) {
    if (typeof body.status !== 'boolean') {
      throw new HttpError(400, 'Status deve ser true ou false');
    }
    out.status = body.status;
  } else if (!partial) {
    out.status = false;
  }

  if (partial && Object.keys(out).length === 0) {
    throw new HttpError(400, 'Nenhum campo válido para atualizar');
  }

  return out;
}

export async function listUsers(filters: UserFilters): Promise<User[]> {
  return userRepository.findAll(filters);
}

export async function getUser(id: number): Promise<User> {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new HttpError(404, 'Usuário não encontrado');
  }
  return user;
}

export async function createUser(data: CreateUserDTO): Promise<User> {
  const clean = validate(data, false) as CreateUserDTO;
  return userRepository.create(clean);
}

export async function updateUser(id: number, data: CreateUserDTO): Promise<User> {
  const clean = validate(data, false) as CreateUserDTO;
  await getUser(id);
  return userRepository.update(id, clean);
}

export async function patchUser(id: number, fields: Partial<CreateUserDTO>): Promise<User> {
  const clean = validate(fields, true);
  await getUser(id);
  return userRepository.patch(id, clean);
}

export async function deleteUser(id: number): Promise<void> {
  await getUser(id);
  await userRepository.remove(id);
}