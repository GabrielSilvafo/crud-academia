import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../models/user.model';
import { UserService } from '../../services/user.service';
import { GymService, Exercise } from '../../services/gym.service';
import { errorMessage } from '../../shared/format';

@Component({
  selector: 'app-exercises',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Exercícios</h1>
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
          <label>Treino</label>
          <input type="text" list="treinos" [(ngModel)]="workout" placeholder="Treino A" />
          <datalist id="treinos">
            <option value="Treino A"></option>
            <option value="Treino B"></option>
            <option value="Treino C"></option>
            <option value="Treino D"></option>
          </datalist>
        </div>
        <div class="form-field">
          <label>Exercício</label>
          <input type="text" [(ngModel)]="name" placeholder="Ex.: Supino reto" />
        </div>
        <div class="form-field">
          <label>Séries</label>
          <input type="number" [(ngModel)]="sets" placeholder="3" />
        </div>
        <div class="form-field">
          <label>Repetições</label>
          <input type="text" [(ngModel)]="reps" placeholder="12 ou 8-10" />
        </div>
        <div class="form-field">
          <label>Observação (opcional)</label>
          <input type="text" [(ngModel)]="notes" placeholder="Ex.: descanso 60s" />
        </div>
        <button class="btn btn-primary" (click)="add()">Adicionar</button>
      </div>
    </div>

    <ng-container *ngIf="userId">
      <ng-container *ngIf="list.length; else empty">
        <table>
          <tr>
            <th>Treino</th>
            <th>Exercício</th>
            <th>Séries x repetições</th>
            <th>Observação</th>
            <th></th>
          </tr>
          <tr *ngFor="let e of list">
            <td>{{ e.workout }}</td>
            <td>{{ e.name }}</td>
            <td>{{ setsReps(e) }}</td>
            <td>{{ e.notes }}</td>
            <td><button class="btn btn-danger" (click)="remove(e)">Excluir</button></td>
          </tr>
        </table>
      </ng-container>

      <ng-template #empty>
        <div class="card empty-state">Nenhum exercício cadastrado para este aluno.</div>
      </ng-template>
    </ng-container>
  `,
})
export class ExercisesComponent implements OnInit {
  users: User[] = [];
  userId: number | null = null;
  list: Exercise[] = [];

  workout = 'Treino A';
  name = '';
  sets: number | null = null;
  reps = '';
  notes = '';

  message = '';
  error = '';

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
    this.clearMessages();
    if (id) this.load();
  }

  load(): void {
    if (!this.userId) return;
    this.gym.listExercises(this.userId).subscribe({
      next: l => (this.list = l),
      error: e => this.showError(e),
    });
  }

  add(): void {
    this.clearMessages();
    if (!this.userId || !this.name.trim()) {
      this.error = 'Escolha o aluno e escreva o exercício.';
      return;
    }
    const body: { workout?: string; name: string; sets?: number; reps?: string; notes?: string } = {
      workout: this.workout.trim() || 'Treino A',
      name: this.name.trim(),
    };
    if (this.sets) body.sets = Number(this.sets);
    if (this.reps.trim()) body.reps = this.reps.trim();
    if (this.notes.trim()) body.notes = this.notes.trim();

    this.gym.addExercise(this.userId, body).subscribe({
      next: () => {
        this.message = 'Exercício adicionado.';
        this.name = '';
        this.sets = null;
        this.reps = '';
        this.notes = '';
        this.load();
      },
      error: e => this.showError(e),
    });
  }

  remove(e: Exercise): void {
    this.clearMessages();
    if (!confirm('Excluir o exercício ' + e.name + '?')) return;
    this.gym.deleteExercise(e.id).subscribe({
      next: () => {
        this.message = 'Exercício excluído.';
        this.load();
      },
      error: err => this.showError(err),
    });
  }

  setsReps(e: Exercise): string {
    if (e.sets && e.reps) return e.sets + ' x ' + e.reps;
    if (e.sets) return e.sets + (e.sets === 1 ? ' série' : ' séries');
    if (e.reps) return e.reps + ' repetições';
    return '-';
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