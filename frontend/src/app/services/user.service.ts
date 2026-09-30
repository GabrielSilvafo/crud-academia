import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = 'http://localhost:3000/api/users';

  constructor(private http: HttpClient) {}

  list(filters?: { name?: string; status?: boolean }): Observable<User[]> {
    let params = new HttpParams();
    if (filters?.name) params = params.set('name', filters.name);
    if (filters?.status !== undefined) params = params.set('status', String(filters.status));
    return this.http.get<User[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  create(user: User): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  update(id: number, user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user);
  }

  patch(id: number, fields: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, fields);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}