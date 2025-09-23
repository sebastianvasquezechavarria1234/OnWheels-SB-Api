// models/Compra.js
export default class Compra {
  constructor({
    id_compra,
    NIT_proveedor,
    fecha_compra,
    fecha_aproximada_entrega,
    total_compra,
    estado
  }) {
    this.id_compra = id_compra
    this.NIT_proveedor = NIT_proveedor
    this.fecha_compra = fecha_compra
    this.fecha_aproximada_entrega = fecha_aproximada_entrega
    this.total_compra = total_compra
    this.estado = estado
  }
}
