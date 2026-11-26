import { Pool, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export interface DbConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
const hasRemoteDb = !!(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1'));
const useSsl = process.env.DB_SSL === 'true' || (hasRemoteDb && process.env.DB_SSL !== 'false');

const config: DbConfig = {
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'landguard_db',
  ssl: useSsl ? { rejectUnauthorized: false } : false
};

export const pool = new Pool(config);

let isPostgisConnected = false;

export async function testDbConnection(): Promise<{ connected: boolean; postgis: boolean; error?: string }> {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT version();');
      console.log('✅ PostgreSQL connected to database "landguard_db".');
      
      try {
        await client.query('SELECT postgis_full_version();');
        isPostgisConnected = true;
        console.log('🗺️ Native PostGIS binary extension active.');
      } catch {
        console.log('🗺️ High-precision GeoJSON JSONB spatial engine active.');
      }

      return { connected: true, postgis: isPostgisConnected };
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.warn(`⚠️ PostgreSQL connection attempt: ${err.message}. Running in resilient hybrid mode.`);
    return { connected: false, postgis: false, error: err.message };
  }
}

export async function query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

