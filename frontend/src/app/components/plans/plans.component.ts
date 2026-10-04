import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Plan } from '../../models/gym.model';
import { GymService, PlanInput } from '../../services/gym.service';
import { money, errorMessage } from '../../shared/format';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <h1>Planos</h1>
    </div>

    <div class="alert alert-error" *ngIf="error">{{ error }}</div>
    <div class="alert alert-ok" *ngIf="message">{{ message }}</div>

    <p><small>
      Plano que já tem matrículas não pode ser excluído. Nesse caso, use <strong>Desativar</strong>:
      ele some da lista na hora de matricular, mas o histórico continua.
    </small></p>

    <ng-container *ngIf="plans.length; else empty">
      <table>
        <tr>
          <th>Plano</th>
          <th>Duração</th>
          <th>Preço</th>
          <th>Situação</th>
          <th></th>
        </tr>
        <tr *ngFor="let p of plans">
          <td>{{ p.name }}<br /><small>{{ p.description }}</small></td>
          <td>{{ months(p.duration_months) }}</td>
          <td>{{ money(p.price) }}</td>
          <td>
            <span class="badge" [class.badge-on]="p.active" [class.badge-off]="!p.active">
              {{ p.active ? 'Ativo' : 'Inativo' }}
            </span>
          </td>
          <td>
            <div class="row-actions">
              <button class="btn btn-secondary" (click)="toggle(p)">{{ p.active ? 'Desativar' : 'Ativar' }}</button>
              <button class="btn btn-danger" (click)="remove(p)">Excluir</button>
            </div>
          </td>
        </tr>
      </table>
    </ng-container>

    <ng-template #empty>
      <div class="card empty-state">Nenhum plano cadastrado.</div>
    </ng-template>
  `,
})
export class PlansComponent implements OnInit {
  plans: Plan[] = [];
  message = '';
  error = '';

  money = money;

  constructor(private gym: GymService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.gym.listPlans(false).subscribe({
      next: list => (this.plans = list),
      error: e => this.showError(e),
    });
  }

  months(n: number): string {
    return n === 1 ? '1 mês' : n + ' meses';
  }

  toggle(p: Plan): void {
    this.clearMessages();
    const body: PlanInput = {
      name: p.name,
      price: p.price,
      duration_months: p.duration_months,
      description: p.description,
      active: !p.active,
    };
    this.gym.updatePlan(p.id, body).subscribe({
      next: () => {
        this.message = p.active ? 'Plano desativado.' : 'Plano ativado.';
        this.load();
      },
      error: e => this.showError(e),
    });
  }

  remove(p: Plan): void {
    this.clearMessages();
    if (!confirm('Excluir o plano ' + p.name + '?')) return;
    this.gym.deletePlan(p.id).subscribe({
      next: () => {
        this.message = 'Plano excluído.';
        this.load();
      },
      error: e => {
        if (e?.status === 409) {
          this.error = 'Este plano já tem matrículas. Use Desativar em vez de excluir.';
        } else {
          this.showError(e);
        }
      },
    });
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