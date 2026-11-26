import fs from 'fs';
import path from 'path';
import { pool } from './db';

async function runMigrations() {
  console.log('🚀 Starting LandGuard Database Migrations...');
  const client = await pool.connect();
  try {
    const migrationDir = path.join(__dirname, '../../migrations');
    const files = fs.readdirSync(migrationDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      console.log(`Executing migration: ${file}...`);
      const filePath = path.join(migrationDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      await client.query(sql);
      console.log(`✅ Applied migration: ${file}`);
    }
    console.log('🎉 All migrations applied successfully.');
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations();
}

export { runMigrations };
