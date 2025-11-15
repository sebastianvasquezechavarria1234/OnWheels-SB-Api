// models/Evento.js
export default class Evento {
  constructor({
    id_evento,
    id_categoria_evento,
    id_sede,
    nombre_evento,
    fecha_evento,
    hora_inicio,
    hora_aproximada_fin,
    descripcion,
    imagen_evento,
    estado
  }) {
    this.id_evento = id_evento
    this.id_categoria_evento = id_categoria_evento
    this.id_sede = id_sede
    this.nombre_evento = nombre_evento
    this.fecha_evento = fecha_evento
    this.hora_inicio = hora_inicio
    this.hora_aproximada_fin = hora_aproximada_fin
    this.descripcion = descripcion
    this.imagen_evento = imagen_evento
    this.estado = estado
  }
}
