export default class Usuario {
  constructor({
    id_usuario,
    nombre_completo,
    email,
    telefono,
    fecha_nacimiento,
    contrasena,
    estado = true
  }) {
    this.id_usuario = id_usuario;
    this.nombre_completo = nombre_completo;
    this.email = email;
    this.telefono = telefono;
    this.fecha_nacimiento = fecha_nacimiento;
    this.contrasena = contrasena;
    this.estado = estado;
  }
}