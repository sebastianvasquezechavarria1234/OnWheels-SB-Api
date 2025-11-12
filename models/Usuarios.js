// models/Usuarios.js
class Usuario {
  constructor({
    id_usuario,
    documento,
    tipo_documento,
    nombre_completo,
    email,
    telefono,
    fecha_nacimiento,
    direccion,
    contraseña,
    tipo_genero
  }) {
    this.id_usuario = id_usuario
    this.documento = documento
    this.tipo_documento = tipo_documento
    this.nombre_completo = nombre_completo
    this.email = email
    this.telefono = telefono
    this.fecha_nacimiento = fecha_nacimiento
    this.direccion = direccion
    this.contraseña = contraseña
    this.tipo_genero = tipo_genero
  }
}

export default Usuario
