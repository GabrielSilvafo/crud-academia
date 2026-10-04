import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Plan, Membership, PayResult, Measurement } from '../models/gym.model';

export interface PlanInput {
  name: string;
  price: number;
  duration_months: number;
  description: string | null;
  active: boolean;
}

export interface Exercise {
  id: number;
  user_id: number;
  workout: string;
  name: string;
  sets: number | null;
  reps: string | null;
  notes: string | null;
}

@Injectable({ providedIn: 'root' })
export class GymService {
  private api = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // planos
  listPlans(onlyActive = false): Observable<Plan[]> {
    let params = new HttpParams();
    if (onlyActive) params = params.set('active', 'true');
    return this.http.get<Plan[]>(`${this.api}/plans`, { params });
  }

  updatePlan(id: number, body: PlanInput): Observable<Plan> {
    return this.http.put<Plan>(`${this.api}/plans/${id}`, body);
  }

  deletePlan(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/plans/${id}`);
  }

  // matrículas e pagamentos
  listMemberships(situation = ''): Observable<Membership[]> {
    let params = new HttpParams();
    if (situation) params = params.set('situation', situation);
    return this.http.get<Membership[]>(`${this.api}/memberships`, { params });
  }

  createMembership(body: { user_id: number; plan_id: number; start_date?: string }): Observable<Membership> {
    return this.http.post<Membership>(`${this.api}/memberships`, body);
  }

  cancelMembership(id: number): Observable<Membership> {
    return this.http.post<Membership>(`${this.api}/memberships/${id}/cancel`, {});
  }

  pay(membershipId: number, method: string): Observable<PayResult> {
    return this.http.post<PayResult>(`${this.api}/memberships/${membershipId}/payments`, { method });
  }

  // peso e altura
  listMeasurements(userId: number): Observable<Measurement[]> {
    return this.http.get<Measurement[]>(`${this.api}/users/${userId}/measurements`);
  }

  addMeasurement(
    userId: number,
    body: { weight_kg: number; height_cm: number; measured_at?: string; notes?: string }
  ): Observable<Measurement> {
    return this.http.post<Measurement>(`${this.api}/users/${userId}/measurements`, body);
  }

  deleteMeasurement(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/measurements/${id}`);
  }

  // exercícios
  listExercises(userId: number): Observable<Exercise[]> {
    return this.http.get<Exercise[]>(`${this.api}/users/${userId}/exercises`);
  }

  addExercise(
    userId: number,
    body: { workout?: string; name: string; sets?: number; reps?: string; notes?: string }
  ): Observable<Exercise> {
    return this.http.post<Exercise>(`${this.api}/users/${userId}/exercises`, body);
  }

  deleteExercise(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/exercises/${id}`);
  }
}