// debug_roles.js  –  node debug_roles.js
// Run with: node debug_roles.js

import pool from "./db/postgresPool.js";

const TARGET_EMAIL = "cliente.demo@prueba.com";

async function main() {
  const client = await pool.connect();
  try {
    console.log("\n========== DIAGNÓSTICO DE ROLES ==========\n");

    // 1. Buscar usuario
    const userRes = await client.query(
      "SELECT id_usuario, nombre_completo, email FROM usuarios WHERE email = $1",
      [TARGET_EMAIL]
    );
    if (userRes.rowCount === 0) {
      console.error("❌ Usuario NO encontrado:", TARGET_EMAIL);
      return;
    }
    const u = userRes.rows[0];
    console.log("✅ Usuario encontrado:", u);

    // 2. Roles actuales en usuario_roles
    const rolesRes = await client.query(
      `SELECT r.id_rol, r.nombre_rol
       FROM usuario_roles ur
       JOIN roles r ON ur.id_rol = r.id_rol
       WHERE ur.id_usuario = $1`,
      [u.id_usuario]
    );
    console.log("\n[usuario_roles] Roles asignados actualmente:", rolesRes.rows);

    // 3. Verificar que existe el rol 'Estudiante' en la tabla roles
    const rolCheck = await client.query(
      "SELECT id_rol, nombre_rol FROM roles WHERE LOWER(TRIM(nombre_rol)) = 'estudiante' LIMIT 1"
    );
    console.log("\n[roles] Rol 'estudiante' existe?:", rolCheck.rows.length > 0 ? rolCheck.rows[0] : "❌ NO EXISTE");

    // 4. Todos los roles de la tabla roles
    const allRoles = await client.query("SELECT id_rol, nombre_rol FROM roles ORDER BY id_rol");
    console.log("\n[roles] Todos los roles en BD:", allRoles.rows);

    // 5. Verificar constraint UNIQUE en usuario_roles
    const constraintRes = await client.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'usuario_roles'
      AND constraint_type IN ('PRIMARY KEY', 'UNIQUE')
    `);
    console.log("\n[usuario_roles] Constraints:", constraintRes.rows);

    // 6. Registro de estudiante
    const estRes = await client.query(
      `SELECT id_estudiante, id_usuario, estado
       FROM estudiantes WHERE id_usuario = $1`,
      [u.id_usuario]
    );
    console.log("\n[estudiantes] Registros:", estRes.rows);

    // 7. Matrículas
    const matRes = await client.query(
      `SELECT m.id_matricula, m.estado, m.id_estudiante, m.fecha_inicio
       FROM matriculas m
       JOIN estudiantes e ON m.id_estudiante = e.id_estudiante
       WHERE e.id_usuario = $1`,
      [u.id_usuario]
    );
    console.log("\n[matriculas] Matrículas:", matRes.rows);

    // 8. Intentar asignar el rol manualmente como test
    if (rolCheck.rows.length > 0) {
      const id_rol = rolCheck.rows[0].id_rol;
      console.log(`\n[TEST] Intentando insertar rol ${id_rol} para usuario ${u.id_usuario}...`);
      try {
        await client.query(
          `INSERT INTO usuario_roles (id_usuario, id_rol)
           VALUES ($1, $2)
           ON CONFLICT (id_usuario, id_rol) DO NOTHING`,
          [u.id_usuario, id_rol]
        );
        console.log("✅ INSERT ejecutado sin errores.");
      } catch (err) {
        console.error("❌ Error al insertar en usuario_roles:", err.message);
        console.error("   Hint: Probablemente falta constraint UNIQUE en (id_usuario, id_rol)");
      }

      // Verificar resultado después del test
      const afterRes = await client.query(
        `SELECT r.nombre_rol FROM usuario_roles ur JOIN roles r ON ur.id_rol = r.id_rol WHERE ur.id_usuario = $1`,
        [u.id_usuario]
      );
      console.log("\n[TEST] Roles DESPUÉS de la prueba:", afterRes.rows);
    }

  } finally {
    client.release();
    await pool.end();
    console.log("\n==========================================\n");
  }
}

main().catch(console.error);
