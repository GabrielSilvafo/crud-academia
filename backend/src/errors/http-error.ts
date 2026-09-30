import { Request, Response } from 'express';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

type Handler = (req: Request, res: Response) => Promise<void>;

// Envolve cada rota: qualquer erro vira uma resposta HTTP em vez de travar a requisição
export const handle =
  (fn: Handler): Handler =>
  async (req, res) => {
    try {
      await fn(req, res);
    } catch (err: any) {
      if (err instanceof HttpError) {
        res.status(err.status).json({ error: err.message });
      } else if (err?.code === '23505') {
        res.status(409).json({
          error:
            err.constraint === 'one_active_membership'
              ? 'Este aluno já tem uma matrícula ativa'
              : 'Registro duplicado',
        });
      } else if (err?.code === '23503') {
        res.status(409).json({ error: 'Registro em uso por outros dados, ou referência inexistente' });
      } else if (err?.code === '23514' || err?.code === '22007' || err?.code === '22008') {
        res.status(400).json({ error: 'Valor ou data fora do permitido' });
      } else {
        console.error(err);
        res.status(500).json({ error: 'Erro interno no servidor' });
      }
    }
  };

export function parseId(value: unknown, label = 'Id'): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `${label} inválido`);
  }
  return id;
}
