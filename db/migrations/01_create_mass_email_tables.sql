-- Tabla para el historial de envíos masivos
CREATE TABLE IF NOT EXISTS envios_masivos (
  id_envio SERIAL PRIMARY KEY,
  asunto VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  roles_destinatarios TEXT, -- Guardamos los nombres de los roles como texto (ej: "Estudiante, Instructor")
  total_destinatarios INTEGER DEFAULT 0,
  fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estado VARCHAR(50) DEFAULT 'completado' -- completado, error, en_proceso
);

-- Tabla para el detalle de destinatarios de cada envío
CREATE TABLE IF NOT EXISTS envios_destinatarios (
  id_detalle SERIAL PRIMARY KEY,
  id_envio INTEGER REFERENCES envios_masivos(id_envio) ON DELETE CASCADE,
  id_usuario INTEGER REFERENCES usuarios(id_usuario),
  correo VARCHAR(255) NOT NULL,
  fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estado VARCHAR(50) DEFAULT 'enviado', -- enviado, error
  error_msg TEXT
);
