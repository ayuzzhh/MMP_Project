import app from '../backend/src/index';
import { initializeDatabaseSchema } from '../backend/src/config/initDb';

let initialized = false;

export default async function handler(req: any, res: any) {
  if (!initialized) {
    try {
      await initializeDatabaseSchema();
      initialized = true;
    } catch (err: any) {
      console.warn('Vercel serverless startup initialization warning:', err.message);
    }
  }
  return app(req, res);
}
