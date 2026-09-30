import pool from '../config/database';
import { User, UserFilters, CreateUserDTO } from '../types/user';
 
export async function findAll(filters: UserFilters = {}): Promise<User[]> {
  let query = 'SELECT * FROM users WHERE 1=1';
  const values: unknown[] = [];
 
  if (filters.name) {
    values.push(`%${filters.name}%`);
    query += ` AND name ILIKE $${values.length}`;
  }
  if (filters.status !== undefined) {
    values.push(filters.status);
    query += ` AND status = $${values.length}`;
  }
 
  query += ' ORDER BY id';
  const result = await pool.query(query, values);
  return result.rows;
}
 
export async function findById(id: number): Promise<User | undefined> {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
}
 
export async function create(data: CreateUserDTO): Promise<User> {
  const { name, email, age, status } = data;
  const result = await pool.query(
    `INSERT INTO users (name, email, age, status)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, email, age, status]
  );
  return result.rows[0];
}
 
export async function update(id: number, data: CreateUserDTO): Promise<User> {
  const { name, email, age, status } = data;
  const result = await pool.query(
    `UPDATE users SET name=$1, email=$2, age=$3, status=$4
     WHERE id=$5 RETURNING *`,
    [name, email, age, status, id]
  );
  return result.rows[0];
}
 
export async function patch(id: number, fields: Partial<CreateUserDTO>): Promise<User> {
  const keys = Object.keys(fields) as (keyof CreateUserDTO)[];
  const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = [...keys.map(k => fields[k]), id];
 
  const result = await pool.query(
    `UPDATE users SET ${sets} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return result.rows[0];
}
 
export async function remove(id: number): Promise<void> {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
}
 