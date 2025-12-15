-- Agregar columna faltante a envios_masivos
ALTER TABLE envios_masivos ADD COLUMN IF NOT EXISTS roles_destinatarios TEXT;
