import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Plan, Membership, Payment, PayResult, Measurement, GymSummary } from '../models/gym.model';

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

  // matrículas
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

  // pagamentos
  listPayments(membershipId: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.api}/memberships/${membershipId}/payments`);
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

  // resumo
  summary(): Observable<GymSummary> {
    return this.http.get<GymSummary>(`${this.api}/gym/summary`);
  }
}
