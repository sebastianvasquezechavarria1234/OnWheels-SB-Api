module.exports = class Estudiante {
  constructor({
    id_estudiante,
    id_usuario,
    documento,
    tipo_documento,
    estado = 'Activo',
    enfermedad,
    nivel_experiencia,
    edad,
    fecha_preinscripcion,
    id_acudiente
  }) {
    this.id_estudiante = id_estudiante;
    this.id_usuario = id_usuario;
    this.documento = documento;
    this.tipo_documento = tipo_documento;
    this.estado = estado;
    this.enfermedad = enfermedad;
    this.nivel_experiencia = nivel_experiencia;
    this.edad = edad;
    this.fecha_preinscripcion = fecha_preinscripcion;
    this.id_acudiente = id_acudiente;
  }
};