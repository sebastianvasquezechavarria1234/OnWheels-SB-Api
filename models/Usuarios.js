class Usuario {
  constructor({
    id_usuario,
    nombre_completo,
    email,
    telefono,
    fecha_nacimiento,
    contrasena,
    estado,
    documento,
    tipo_documento
  }) {
    this.id_usuario = id_usuario;
    this.documento = documento;
    this.tipo_documento = tipo_documento;
    this.nombre_completo = nombre_completo;
    this.email = email;
    this.telefono = telefono;
    this.fecha_nacimiento = fecha_nacimiento;
    this.contrasena = contrasena;
    this.estado = estado;
  }
}

export default Usuario;
