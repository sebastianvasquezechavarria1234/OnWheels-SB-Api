import pool from '../db/postgresPool.js';
import bcryptjs from 'bcryptjs';

export const activateAccount = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ message: "Token y contraseña son requeridos" });
    }

    try {
        const client = await pool.connect();
        try {
            // 1. Buscar usuario con ese token y que no haya expirado
            const userRes = await client.query(
                "SELECT id_usuario FROM usuarios WHERE activation_token = $1 AND token_expiration > NOW()",
                [token]
            );

            if (userRes.rowCount === 0) {
                return res.status(400).json({ message: "Token inválido o expirado" });
            }

            const userId = userRes.rows[0].id_usuario;

            // 2. Hashear nueva contraseña
            const salt = await bcryptjs.genSalt(10);
            const hashedPassword = await bcryptjs.hash(newPassword, salt);

            // 3. Activar usuario y limpiar token
            await client.query("BEGIN");

            await client.query(
                `UPDATE usuarios 
         SET estado = true, 
             contrasena = $1, 
             activation_token = NULL, 
             token_expiration = NULL 
         WHERE id_usuario = $2`,
                [hashedPassword, userId]
            );

            await client.query("COMMIT");

            res.status(200).json({ message: "Cuenta activada correctamente. Ahora puedes iniciar sesión." });

        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error al activar cuenta:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};
