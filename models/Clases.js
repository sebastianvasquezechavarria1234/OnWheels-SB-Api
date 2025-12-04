// models/Clase.js
export default class Clase {
  constructor({
    id_clase,
    id_nivel,
    id_sede,
    id_instructor,
    cupo_maximo,
    dia_semana,
    descripcion,
    estado,
    hora_inicio,
    hora_fin
  }) {
    this.id_clase = id_clase
    this.id_nivel = id_nivel
    this.id_sede = id_sede
    this.id_instructor = id_instructor
    this.cupo_maximo = cupo_maximo
    this.dia_semana = dia_semana
    this.descripcion = descripcion
    this.estado = estado
    this.hora_inicio = hora_inicio
    this.hora_fin = hora_fin
  }
}