import pg from "pg";
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
// A typed query helper function
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};
