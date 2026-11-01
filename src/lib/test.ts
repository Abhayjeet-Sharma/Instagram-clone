import { query } from './db.js';

async function setupDatabase() {
  try {
    console.log('⏳ Running database setup...');

    // 1. Create a test users table if it doesn't already exist
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await query(createTableSql);
    console.log('✅ Table "users" is ready!');

    // 2. Insert a test user safely using parameterized parameters ($1, $2)
    const insertUserSql = `
      INSERT INTO users (name, email) 
      VALUES ($1, $2) 
      ON CONFLICT (email) DO NOTHING
      RETURNING *;
    `;
    const insertResult = await query(insertUserSql, ['Test User', 'test@example.com']);
    
    if (insertResult.rows.length > 0) {
      console.log('✅ Test user inserted:', insertResult.rows[0]);
    } else {
      console.log('ℹ️ Test user already exists in the table.');
    }

    // 3. Fetch and print all rows from the table to verify
    const fetchResult = await query('SELECT * FROM users;');
    console.log('📊 Current rows in "users" table:', fetchResult.rows);

  } catch (error) {
    console.error('❌ Database query failed:', error);
  }
}

setupDatabase();