import pool from "./db/postgresPool.js";

const permissions = [
    // Sedes
    { name: 'ver_sedes', desc: 'Ver sedes' },
    { name: 'gestionar_sedes', desc: 'Crear, editar y eliminar sedes' },
    // Patrocinadores
    { name: 'ver_patrocinadores', desc: 'Ver patrocinadores' },
    { name: 'gestionar_patrocinadores', desc: 'Crear, editar y eliminar patrocinadores' },
    // Preinscripciones
    { name: 'ver_preinscripciones', desc: 'Ver preinscripciones' },
    { name: 'gestionar_preinscripciones', desc: 'Gestionar preinscripciones' },
    // Planes
    { name: 'ver_planes', desc: 'Ver planes de clases' },
    { name: 'gestionar_planes', desc: 'Gestionar planes de clases' },
    // Niveles
    { name: 'ver_niveles', desc: 'Ver niveles de clases' },
    { name: 'gestionar_niveles', desc: 'Gestionar niveles de clases' },
    // Categoria Eventos
    { name: 'ver_categoria_eventos', desc: 'Ver categorías de eventos' },
    { name: 'gestionar_categoria_eventos', desc: 'Gestionar categorías de eventos' },
    // Categoria Productos
    { name: 'ver_categoria_productos', desc: 'Ver categorías de productos' },
    { name: 'gestionar_categoria_productos', desc: 'Gestionar categorías de productos' },
    // Usuarios & Roles (In case they are missing for some roles)
    { name: 'ver_usuarios', desc: 'Ver listado de usuarios' },
    { name: 'gestionar_usuarios', desc: 'Gestionar usuarios del sistema' },
    { name: 'ver_roles', desc: 'Ver roles y permisos' },
    { name: 'gestionar_roles', desc: 'Gestionar roles y permisos' },
    // Proveedores
    { name: 'ver_proveedores', desc: 'Ver proveedores' },
    { name: 'gestionar_proveedores', desc: 'Gestionar proveedores' }
];

async function seedPermissions() {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        for (const p of permissions) {
            await client.query(`
                INSERT INTO permisos (nombre_permiso, descripcion)
                VALUES ($1, $2)
                ON CONFLICT (nombre_permiso) DO UPDATE SET descripcion = $2
            `, [p.name, p.desc]);
        }
        await client.query("COMMIT");
        console.log("✅ Permisos sembrados correctamente");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("❌ Error sembrando permisos:", err);
    } finally {
        client.release();
        process.exit();
    }
}

seedPermissions();
