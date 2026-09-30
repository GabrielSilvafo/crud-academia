export interface Plan {
  id: number;
  name: string;
  price: number;
  duration_months: number;
  description: string | null;
  active: boolean;
}

export interface Membership {
  id: number;
  user_id: number;
  user_name: string;
  plan_id: number;
  plan_name: string;
  price: number;
  start_date: string;
  due_date: string;
  canceled_at: string | null;
  situation: 'ativa' | 'vencida' | 'cancelada';
  days_to_due: number;
}

export interface Payment {
  id: number;
  membership_id: number;
  amount: number;
  method: string;
  paid_at: string;
  period_end: string;
}

export interface PayResult {
  payment: Payment;
  membership: Membership;
}

export interface Measurement {
  id: number;
  user_id: number;
  weight_kg: number;
  height_cm: number;
  measured_at: string;
  notes: string | null;
  imc: number;
}

export interface GymSummary {
  active_members: number;
  overdue: number;
  expiring_7_days: number;
  revenue_month: number;
}