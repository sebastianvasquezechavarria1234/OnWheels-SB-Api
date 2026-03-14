import pool from "./postgresPool.js";

const runMigration = async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    console.log("Alterando tabla matriculas...");
    await client.query(`
      ALTER TABLE matriculas 
      ADD COLUMN IF NOT EXISTS fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
      ADD COLUMN IF NOT EXISTS fecha_fin DATE NOT NULL DEFAULT CURRENT_DATE,
      ADD COLUMN IF NOT EXISTS precio_plan DECIMAL(10,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_pagado DECIMAL(10,2) DEFAULT 0;
    `);

    console.log("Creando tabla pagos...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS pagos (
        id SERIAL PRIMARY KEY,
        matricula_id INT NOT NULL REFERENCES matriculas(id_matricula) ON DELETE CASCADE,
        monto DECIMAL(10,2) NOT NULL,
        fecha DATE NOT NULL DEFAULT CURRENT_DATE,
        nota TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Alterando tabla planes_clases...");
    await client.query(`
      ALTER TABLE planes_clases 
      ADD COLUMN IF NOT EXISTS duracion_meses INT NOT NULL DEFAULT 1;
    `);

    await client.query("COMMIT");
    console.log("¡Migración completada con éxito!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error durante la migración:", error);
  } finally {
    client.release();
    process.exit(0);
  }
};

runMigration();
