import { Routes } from '@angular/router';
import { UserListComponent } from './components/user-list/user-list.component';
import { UserFormComponent } from './components/user-form/user-form.component';
import { MembershipListComponent } from './components/membership-list/membership-list.component';
import { PlansComponent } from './components/plans/plans.component'; // NOVO
import { ExercisesComponent } from './components/exercises/exercises.component'; // NOVO
import { MeasurementsComponent } from './components/measurements/measurements.component'; // NOVO

export const routes: Routes = [
  { path: '', component: UserListComponent },
  { path: 'novo', component: UserFormComponent },
  { path: 'editar/:id', component: UserFormComponent },
  { path: 'matriculas', component: MembershipListComponent },
  { path: 'planos', component: PlansComponent }, // NOVO
  { path: 'exercicios', component: ExercisesComponent }, // NOVO
  { path: 'medidas', component: MeasurementsComponent } // NOVO
];