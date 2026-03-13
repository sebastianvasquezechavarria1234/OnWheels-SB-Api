
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function debugSchema() {
    const client = await pool.connect();
    try {
        console.log("Connected to DB");

        // Check columns of ACUDIENTES table
        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'acudientes';
    `);
        console.log("Columns in 'acudientes':", res.rows);

    } catch (err) {
        console.error("Query failed:", err);
    } finally {
        client.release();
        pool.end();
    }
}

debugSchema();
