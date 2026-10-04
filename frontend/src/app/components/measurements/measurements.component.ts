import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../models/user.model';
import { Measurement } from '../../models/gym.model';
import { UserService } from '../../services/user.service';
import { GymService } from '../../services/gym.service';
import { fmtDate, errorMessage } from '../../shared/format';

@Component({
  selector: 'app-measurements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Peso e altura</h1>
    </div>

    <div class="alert alert-error" *ngIf="error">{{ error }}</div>
    <div class="alert alert-ok" *ngIf="message">{{ message }}</div>

    <div class="card card-wide">
      <div class="toolbar">
        <div class="form-field">
          <label>Aluno</label>
          <select [ngModel]="userId" (ngModelChange)="selectUser($event)">
            <option [ngValue]="null">Selecione...</option>
            <option *ngFor="let u of users" [ngValue]="u.id">{{ u.name }}</option>
          </select>
        </div>
      </div>

      <div class="toolbar" *ngIf="userId">
        <div class="form-field">
          <label>Peso (kg)</label>
          <input type="number" step="0.1" [(ngModel)]="weight" />
        </div>
        <div class="form-field">
          <label>Altura (cm)</label>
          <input type="number" step="0.1" [(ngModel)]="height" />
        </div>
        <div class="form-field">
          <label>Data (opcional)</label>
          <input type="date" [(ngModel)]="date" />
        </div>
        <div class="form-field">
          <label>Observação (opcional)</label>
          <input type="text" [(ngModel)]="notes" />
        </div>
        <button class="btn btn-primary" (click)="save()">Registrar</button>
      </div>
    </div>

    <ng-container *ngIf="userId">
      <p *ngIf="list.length">
        <strong>Peso atual:</strong> {{ num(list[0].weight_kg) }} kg &nbsp;·&nbsp;
        <strong>IMC:</strong> {{ num(list[0].imc) }} ({{ imcLabel(list[0].imc) }})
        <ng-container *ngIf="change"> &nbsp;·&nbsp; <strong>Variação:</strong> {{ change }}</ng-container>
      </p>

      <ng-container *ngIf="list.length; else empty">
        <table>
          <tr>
            <th>Data</th>
            <th>Peso</th>
            <th>Altura</th>
            <th>IMC</th>
            <th>Observação</th>
            <th></th>
          </tr>
          <tr *ngFor="let m of list">
            <td>{{ fmt(m.measured_at) }}</td>
            <td>{{ num(m.weight_kg) }} kg</td>
            <td>{{ num(m.height_cm) }} cm</td>
            <td>
              {{ num(m.imc) }}
              <span class="badge" [ngClass]="imcClass(m.imc)">{{ imcLabel(m.imc) }}</span>
            </td>
            <td>{{ m.notes }}</td>
            <td><button class="btn btn-danger" (click)="remove(m)">Excluir</button></td>
          </tr>
        </table>
      </ng-container>

      <ng-template #empty>
        <div class="card empty-state">Nenhuma medição registrada para este aluno.</div>
      </ng-template>
    </ng-container>
  `,
})
export class MeasurementsComponent implements OnInit {
  users: User[] = [];
  userId: number | null = null;
  list: Measurement[] = [];

  weight: number | null = null;
  height: number | null = null;
  date = '';
  notes = '';

  message = '';
  error = '';

  fmt = fmtDate;

  constructor(private userService: UserService, private gym: GymService) {}

  ngOnInit(): void {
    this.userService.list().subscribe({
      next: users => (this.users = users),
      error: e => this.showError(e),
    });
  }

  selectUser(id: number | null): void {
    this.userId = id;
    this.list = [];
    this.weight = null;
    this.height = null;
    this.clearMessages();
    if (id) this.load(true);
  }

  load(prefillHeight = false): void {
    if (!this.userId) return;
    this.gym.listMeasurements(this.userId).subscribe({
      next: l => {
        this.list = l;
        if (prefillHeight && l.length) this.height = l[0].height_cm;
      },
      error: e => this.showError(e),
    });
  }

  save(): void {
    this.clearMessages();
    if (!this.userId || !this.weight || !this.height) {
      this.error = 'Informe peso e altura.';
      return;
    }
    const body: { weight_kg: number; height_cm: number; measured_at?: string; notes?: string } = {
      weight_kg: Number(this.weight),
      height_cm: Number(this.height),
    };
    if (this.date) body.measured_at = this.date;
    if (this.notes.trim()) body.notes = this.notes.trim();

    this.gym.addMeasurement(this.userId, body).subscribe({
      next: () => {
        this.message = 'Medição registrada.';
        this.weight = null;
        this.date = '';
        this.notes = '';
        this.load();
      },
      error: e => this.showError(e),
    });
  }

  remove(m: Measurement): void {
    this.clearMessages();
    if (!confirm('Excluir a medição de ' + fmtDate(m.measured_at) + '?')) return;
    this.gym.deleteMeasurement(m.id).subscribe({
      next: () => {
        this.message = 'Medição excluída.';
        this.load();
      },
      error: e => this.showError(e),
    });
  }

  num(v: number): string {
    return Number(v).toFixed(1).replace('.', ',');
  }

  imcLabel(imc: number): string {
    if (imc < 18.5) return 'Abaixo do peso';
    if (imc < 25) return 'Peso normal';
    if (imc < 30) return 'Sobrepeso';
    return 'Obesidade';
  }

  imcClass(imc: number): string {
    if (imc >= 18.5 && imc < 25) return 'badge-on';
    if (imc >= 30) return 'badge-danger';
    return 'badge-warn';
  }

  get change(): string | null {
    if (this.list.length < 2) return null;
    const first = this.list[this.list.length - 1];
    const d = this.list[0].weight_kg - first.weight_kg;
    return (d > 0 ? '+' : '') + d.toFixed(1).replace('.', ',') + ' kg desde ' + fmtDate(first.measured_at);
  }

  private clearMessages(): void {
    this.message = '';
    this.error = '';
  }

  private showError(e: any): void {
    this.message = '';
    this.error = errorMessage(e);
  }
}