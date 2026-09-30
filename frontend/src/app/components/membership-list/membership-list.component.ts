import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../models/user.model';
import { Plan, Membership } from '../../models/gym.model';
import { UserService } from '../../services/user.service';
import { GymService } from '../../services/gym.service';

@Component({
  selector: 'app-membership-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Matrículas</h1>
    </div>

    <div class="alert alert-error" *ngIf="error">{{ error }}</div>
    <div class="alert alert-ok" *ngIf="message">{{ message }}</div>

    <div class="card card-wide">
      <h3>Nova matrícula</h3>
      <div class="toolbar">
        <div class="form-field">
          <label>Aluno</label>
          <select [(ngModel)]="newUserId">
            <option [ngValue]="null">Selecione...</option>
            <option *ngFor="let u of users" [ngValue]="u.id">{{ u.name }}</option>
          </select>
        </div>
        <div class="form-field">
          <label>Plano</label>
          <select [(ngModel)]="newPlanId">
            <option [ngValue]="null">Selecione...</option>
            <option *ngFor="let p of plans" [ngValue]="p.id">{{ p.name }} - {{ money(p.price) }}</option>
          </select>
        </div>
        <div class="form-field">
          <label>Início (opcional)</label>
          <input type="date" [(ngModel)]="newStartDate" />
        </div>
        <button class="btn btn-primary" (click)="enroll()">Matricular</button>
      </div>
    </div>

    <div class="toolbar">
      <div class="form-field">
        <label>Mostrar</label>
        <select [ngModel]="situation" (ngModelChange)="situation = $event; load()">
          <option value="">Todas</option>
          <option value="ativa">Ativas</option>
          <option value="vencida">Vencidas</option>
          <option value="cancelada">Canceladas</option>
        </select>
      </div>
      <div class="form-field">
        <label>Forma de pagamento</label>
        <select [(ngModel)]="payMethod">
          <option value="pix">Pix</option>
          <option value="dinheiro">Dinheiro</option>
          <option value="cartao">Cartão</option>
          <option value="boleto">Boleto</option>
        </select>
      </div>
    </div>

    <ng-container *ngIf="memberships.length; else empty">
      <table>
        <tr>
          <th>Aluno</th>
          <th>Plano</th>
          <th>Vencimento</th>
          <th>Situação</th>
          <th></th>
        </tr>
        <tr *ngFor="let m of memberships">
          <td>{{ m.user_name }}</td>
          <td>{{ m.plan_name }}<br /><small>{{ money(m.price) }}</small></td>
          <td>{{ fmt(m.due_date) }}<br /><small>{{ dueText(m) }}</small></td>
          <td>
            <span class="badge" [ngClass]="badgeClass(m)">{{ label(m) }}</span>
          </td>
          <td>
            <div class="row-actions" *ngIf="m.situation !== 'cancelada'">
              <button class="btn btn-primary" (click)="pay(m)">Pagar</button>
              <button class="btn btn-danger" (click)="cancel(m)">Cancelar</button>
            </div>
          </td>
        </tr>
      </table>
    </ng-container>

    <ng-template #empty>
      <div class="card empty-state">Nenhuma matrícula encontrada.</div>
    </ng-template>
  `,
})
export class MembershipListComponent implements OnInit {
  memberships: Membership[] = [];
  users: User[] = [];
  plans: Plan[] = [];

  situation = '';
  payMethod = 'pix';

  newUserId: number | null = null;
  newPlanId: number | null = null;
  newStartDate = '';

  message = '';
  error = '';

  constructor(private userService: UserService, private gym: GymService) {}

  ngOnInit(): void {
    this.userService.list().subscribe({
      next: users => (this.users = users),
      error: e => this.showError(e),
    });
    this.gym.listPlans(true).subscribe({
      next: plans => (this.plans = plans),
      error: e => this.showError(e),
    });
    this.load();
  }

  load(): void {
    this.gym.listMemberships(this.situation).subscribe({
      next: list => (this.memberships = list),
      error: e => this.showError(e),
    });
  }

  enroll(): void {
    this.clearMessages();
    if (!this.newUserId || !this.newPlanId) {
      this.error = 'Escolha o aluno e o plano.';
      return;
    }
    const body: { user_id: number; plan_id: number; start_date?: string } = {
      user_id: this.newUserId,
      plan_id: this.newPlanId,
    };
    if (this.newStartDate) body.start_date = this.newStartDate;

    this.gym.createMembership(body).subscribe({
      next: () => {
        this.message = 'Matrícula criada!';
        this.newUserId = null;
        this.newPlanId = null;
        this.newStartDate = '';
        this.load();
      },
      error: e => this.showError(e),
    });
  }

  pay(m: Membership): void {
    this.clearMessages();
    this.gym.pay(m.id, this.payMethod).subscribe({
      next: r => {
        this.message =
          'Pagamento de ' + this.money(r.payment.amount) + ' registrado. Novo vencimento: ' + this.fmt(r.membership.due_date);
        this.load();
      },
      error: e => this.showError(e),
    });
  }

  cancel(m: Membership): void {
    this.clearMessages();
    if (!confirm('Cancelar a matrícula de ' + m.user_name + '?')) return;
    this.gym.cancelMembership(m.id).subscribe({
      next: () => {
        this.message = 'Matrícula cancelada.';
        this.load();
      },
      error: e => this.showError(e),
    });
  }

  // ---------- ajudantes de exibição ----------
  money(v: number): string {
    return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
  }

  fmt(d: string): string {
    const [y, m, day] = d.split('-');
    return day + '/' + m + '/' + y;
  }

  label(m: Membership): string {
    if (m.situation === 'cancelada') return 'Cancelada';
    if (m.situation === 'vencida') return 'Vencida';
    return 'Ativa';
  }

  badgeClass(m: Membership): string {
    if (m.situation === 'cancelada') return 'badge-off';
    if (m.situation === 'vencida') return 'badge-danger';
    if (m.days_to_due <= 7) return 'badge-warn';
    return 'badge-on';
  }

  dueText(m: Membership): string {
    if (m.situation === 'cancelada') return 'matrícula cancelada';
    const d = m.days_to_due;
    if (m.situation === 'vencida') {
      const n = Math.abs(d);
      return n + (n === 1 ? ' dia' : ' dias') + ' em atraso';
    }
    if (d === 0) return 'vence hoje';
    return 'em ' + d + (d === 1 ? ' dia' : ' dias');
  }

  private clearMessages(): void {
    this.message = '';
    this.error = '';
  }

  private showError(e: any): void {
    this.message = '';
    this.error = e?.error?.error ?? 'Não foi possível falar com a API. O backend está rodando?';
  }
}
