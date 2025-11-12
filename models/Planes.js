// models/Planes.js
export default class Plan {
  constructor({ id_plan, nombre_plan, descripcion, precio, duracion_meses }) {
    this.id_plan = id_plan;
    this.nombre_plan = nombre_plan;
    this.descripcion = descripcion;
    this.precio = precio;
    this.duracion_meses = duracion_meses;
  }
}
