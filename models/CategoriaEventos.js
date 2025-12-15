// models/CategoriaEventos.js
export default class CategoriaEventos {
  constructor({
    id_categoria_evento,
    nombre_categoria,
    descripcion
  }) {
    this.id_categoria_evento = id_categoria_evento;
    this.nombre_categoria = nombre_categoria;
    this.descripcion = descripcion || null;
  }
}