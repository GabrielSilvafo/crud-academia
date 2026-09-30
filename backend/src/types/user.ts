export interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  status: boolean;
  created_at: Date;
}

export interface UserFilters {
  name?: string;
  status?: boolean;
}

export interface CreateUserDTO{

    name: string;
    email: string;
    age?: number;
    status?: boolean;

}