import pool from '../db/postgresPool.js';

async function checkRoles() {
    try {
        const roles = await pool.query('SELECT * FROM roles');
        console.log('Roles:', roles.rows);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkRoles();
