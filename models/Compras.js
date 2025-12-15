export default class Compra {
  constructor({
    id_compra,
    nit,
    fecha_compra,
    total,
    estado
  }) {
    this.id_compra = id_compra;
    this.nit = nit;
    this.fecha_compra = fecha_compra;
    this.total = total;
    this.estado = estado;
  }
}
