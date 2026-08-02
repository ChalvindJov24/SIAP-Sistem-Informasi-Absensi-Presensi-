import express from 'express';

import { env } from './config/env.js';
import './config/database.js';
import healthRoutes from './routes/healthRoutes.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(healthRoutes);

app.listen(env.port, () => {
  console.log(`SIAP API server running on http://localhost:${env.port}`);
});