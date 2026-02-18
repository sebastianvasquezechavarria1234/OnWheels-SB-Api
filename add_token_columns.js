import pool from './db/postgresPool.js';

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log("Iniciando migración...");

        // 1. Agregar columna activation_token
        await client.query(`
      ALTER TABLE usuarios 
      ADD COLUMN IF NOT EXISTS activation_token VARCHAR(255) DEFAULT NULL;
    `);
        console.log("Columna 'activation_token' agregada/verificada.");

        // 2. Agregar columna token_expiration
        await client.query(`
      ALTER TABLE usuarios 
      ADD COLUMN IF NOT EXISTS token_expiration TIMESTAMP DEFAULT NULL;
    `);
        console.log("Columna 'token_expiration' agregada/verificada.");

        console.log("Migración completada exitosamente.");
    } catch (error) {
        console.error("Error durante la migración:", error);
    } finally {
        client.release();
        process.exit();
    }
}

runMigration();
