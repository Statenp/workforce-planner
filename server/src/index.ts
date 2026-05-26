import cors from 'cors';
import express from 'express';
import { apiRouter } from './routes.js';

const PORT = Number(process.env.PORT ?? 3001);

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log(`Workforce Planner API listening on http://localhost:${PORT}`);
});
