export function money(v: number): string {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function fmtDate(d: string): string {
  const [y, m, day] = d.split('-');
  return day + '/' + m + '/' + y;
}

export function errorMessage(e: any): string {
  return e?.error?.error ?? 'Não foi possível falar com a API. O backend está rodando?';
}