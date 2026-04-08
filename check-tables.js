import pool from './db/postgresPool.js';

async function checkTables() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('envios_masivos', 'envios_destinatarios');
    `);
    console.log('Existing tables:', res.rows.map(r => r.table_name));
    
    if (res.rows.length < 2) {
      console.log('⚠️ TABLES ARE MISSING!');
    } else {
      const columns = await pool.query(`
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name IN ('envios_masivos', 'envios_destinatarios');
      `);
      console.table(columns.rows);
    }
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    pool.end();
  }
}

checkTables();
