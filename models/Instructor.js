module.exports = class Instructor {
  constructor({
    id_instructor,
    id_usuario,
    documento,
    tipo_documento,
    anios_experiencia,
    especialidad,
    estado = true
  }) {
    this.id_instructor = id_instructor;
    this.id_usuario = id_usuario;
    this.documento = documento;
    this.tipo_documento = tipo_documento;
    this.anios_experiencia = anios_experiencia;
    this.especialidad = especialidad;
    this.estado = estado;
  }
};