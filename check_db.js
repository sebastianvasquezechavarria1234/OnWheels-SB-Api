import pool from './db/postgresPool.js';

pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'clases'")
  .then(res => {
    console.log(res.rows);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
