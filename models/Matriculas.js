// models/Matricula.js
export default class Matricula {
  constructor({ id_matricula, id_preinscripcion, id_clase, id_plan, id_metodo_pago, fecha_matricula, valor_matricula }) {
    this.id_matricula = id_matricula;
    this.id_preinscripcion = id_preinscripcion;
    this.id_clase = id_clase;
    this.id_plan = id_plan;
    this.id_metodo_pago = id_metodo_pago;
    this.fecha_matricula = fecha_matricula;
    this.valor_matricula = valor_matricula;
  }
}
