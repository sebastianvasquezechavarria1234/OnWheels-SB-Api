// models/PlanClase.js
export default class PlanClase {
  constructor({ id_plan, nombre_plan, descripcion, precio, descuento_porcentaje }) {
    this.id_plan = id_plan;
    this.nombre_plan = nombre_plan;
    this.descripcion = descripcion;
    this.precio = precio;
    this.descuento_porcentaje = descuento_porcentaje;
  }
}
