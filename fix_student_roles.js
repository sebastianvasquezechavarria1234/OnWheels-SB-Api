// fix_student_roles.js
// Purpose: Assigns the 'estudiante' role to ALL active students who are missing it.
// Safe to re-run: uses ON CONFLICT DO NOTHING, wrapped in a transaction.
// Run with: node fix_student_roles.js

import pool from "./db/postgresPool.js";

async function main() {
  const client = await pool.connect();
  try {
    console.log("\n========== BACKFILL: Rol Estudiante a Estudiantes Activos ==========\n");

    await client.query("BEGIN");

    // 1. Find the 'estudiante' role id
    const rolRes = await client.query(
      "SELECT id_rol, nombre_rol FROM roles WHERE LOWER(TRIM(nombre_rol)) = 'estudiante' LIMIT 1"
    );
    if (rolRes.rowCount === 0) {
      console.error("❌ El rol 'estudiante' NO existe en la tabla roles. Abortando.");
      await client.query("ROLLBACK");
      return;
    }
    const { id_rol, nombre_rol } = rolRes.rows[0];
    console.log(`✅ Rol encontrado: "${nombre_rol}" (id_rol=${id_rol})`);

    // 2. Find all active students who DON'T have the estudiante role
    const missingRes = await client.query(`
      SELECT DISTINCT e.id_usuario, u.nombre_completo, u.email
      FROM estudiantes e
      JOIN usuarios u ON e.id_usuario = u.id_usuario
      WHERE e.estado = 'Activo'
        AND NOT EXISTS (
          SELECT 1 FROM usuario_roles ur
          WHERE ur.id_usuario = e.id_usuario AND ur.id_rol = $1
        )
      ORDER BY e.id_usuario
    `, [id_rol]);

    console.log(`\n🔍 Estudiantes activos SIN rol estudiante: ${missingRes.rowCount}`);
    missingRes.rows.forEach(r => {
      console.log(`   - ID ${r.id_usuario}: ${r.nombre_completo} (${r.email})`);
    });

    if (missingRes.rowCount === 0) {
      console.log("\n✅ Todos los estudiantes activos ya tienen el rol. Nada que hacer.");
      await client.query("ROLLBACK");
      return;
    }

    // 3. Insert missing roles
    let fixed = 0;
    for (const row of missingRes.rows) {
      await client.query(
        `INSERT INTO usuario_roles (id_usuario, id_rol)
         VALUES ($1, $2)
         ON CONFLICT (id_usuario, id_rol) DO NOTHING`,
        [row.id_usuario, id_rol]
      );
      fixed++;
      console.log(`   ✅ Rol asignado a: ${row.nombre_completo} (id=${row.id_usuario})`);
    }

    await client.query("COMMIT");
    console.log(`\n✅ COMPLETADO: ${fixed} usuario(s) actualizados con rol '${nombre_rol}'.`);

    // 4. Verify results
    const afterRes = await client.query(`
      SELECT u.id_usuario, u.nombre_completo, string_agg(r.nombre_rol, ', ' ORDER BY r.nombre_rol) AS roles
      FROM estudiantes e
      JOIN usuarios u ON e.id_usuario = u.id_usuario
      JOIN usuario_roles ur ON ur.id_usuario = u.id_usuario
      JOIN roles r ON r.id_rol = ur.id_rol
      WHERE e.estado = 'Activo'
      GROUP BY u.id_usuario, u.nombre_completo
      ORDER BY u.id_usuario
    `);
    console.log("\n[VERIFICACIÓN] Roles de todos los estudiantes activos:");
    afterRes.rows.forEach(r => {
      console.log(`   - ${r.nombre_completo}: [${r.roles}]`);
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error durante el backfill:", err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
    console.log("\n=====================================================\n");
  }
}

main().catch(console.error);
