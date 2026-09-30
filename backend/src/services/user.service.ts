import * as userRepository from '../repositories/user.repository';
import { User, UserFilters, CreateUserDTO } from '../types/user';

export async function listUsers(filters: UserFilters): Promise<User[]> {
  return userRepository.findAll(filters);
}

export async function getUser(id: number): Promise<User> {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new Error('Usuário não encontrado');
  }
  return user;
}

export async function createUser(data: CreateUserDTO): Promise<User> {
  return userRepository.create(data);
}

export async function updateUser(id: number, data: CreateUserDTO): Promise<User> {
  await getUser(id);
  return userRepository.update(id, data);
}

export async function patchUser(id: number, fields: Partial<CreateUserDTO>): Promise<User> {
  await getUser(id);
  return userRepository.patch(id, fields);
}

export async function deleteUser(id: number): Promise<void> {
  await getUser(id);
  await userRepository.remove(id);
}
