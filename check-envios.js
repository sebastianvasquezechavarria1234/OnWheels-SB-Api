import pool from './db/postgresPool.js';

async function checkEnvios() {
  try {
    const res = await pool.query('SELECT * FROM envios_masivos ORDER BY fecha_envio DESC LIMIT 5');
    console.log('--- Últimos 5 Envíos Registrados ---');
    console.table(res.rows);
    
    if (res.rows.length > 0) {
      const id = res.rows[0].id_envio;
      const dest = await pool.query('SELECT COUNT(*) FROM envios_destinatarios WHERE id_envio = $1', [id]);
      console.log(`Último envío (ID: ${id}) tiene ${dest.rows[0].count} destinatarios registrados.`);
    }
  } catch (error) {
    console.error('Error checking envios:', error);
  } finally {
    pool.end();
  }
}

checkEnvios();
