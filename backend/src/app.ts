import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import userRoutes from './routes/user.routes';
import gymRoutes from './routes/gym.routes';
import exerciseRoutes from './routes/exercise.routes'; // NOVO

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', userRoutes);
app.use('/api', gymRoutes);
app.use('/api', exerciseRoutes); // NOVO

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno no servidor' });
});

export default app;