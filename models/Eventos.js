export default class Evento {
  constructor({
    id_evento,
    id_categoria_evento,
    id_sede,
    id_patrocinador,
    nombre_evento,
    fecha_evento,
    hora_inicio,
    hora_aproximada_fin,
    descripcion,
    imagen,
    estado,
    nombre_categoria
  }) {
    this.id_evento = id_evento;
    this.id_categoria_evento = id_categoria_evento;
    this.id_sede = id_sede;
    this.id_patrocinador = id_patrocinador;
    this.nombre_evento = nombre_evento;
    this.fecha_evento = fecha_evento;
    this.hora_inicio = hora_inicio;
    this.hora_aproximada_fin = hora_aproximada_fin;
    this.descripcion = descripcion;
    this.imagen = imagen;
    this.estado = estado;
    this.nombre_categoria = nombre_categoria || null;
  }
}
