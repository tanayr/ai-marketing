// Script to execute SQL migration for Lookr Studio setup
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function runLookrMigration() {
  let pool: Pool | null = null;
  
  try {
    console.log('Running migration for Lookr Studio setup...');
    
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Create a new PostgreSQL connection pool
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'migrations', 'add_lookr_to_enum_and_create_avatars.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');
    
    // Split the SQL content by semicolons and filter out empty statements
    const statements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    // Begin a transaction
    await pool.query('BEGIN');
    
    // Execute each SQL statement sequentially
    for (const statement of statements) {
      await pool.query(statement);
      console.log(`Executed: ${statement.substring(0, 50)}${statement.length > 50 ? '...' : ''}`);
    }
    
    // Commit the transaction
    await pool.query('COMMIT');
    
    console.log('Lookr Studio migration completed successfully!');
  } catch (error) {
    // Rollback transaction on error
    if (pool) {
      await pool.query('ROLLBACK').catch(e => console.error('Rollback failed:', e));
    }
    console.error('Lookr Studio migration failed:', error);
    process.exit(1);
  } finally {
    // Close the connection pool
    if (pool) {
      await pool.end().catch(e => console.error('Pool end failed:', e));
    }
  }
  
  process.exit(0);
}

runLookrMigration();
