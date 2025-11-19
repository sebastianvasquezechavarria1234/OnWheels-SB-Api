export default class Compra {
  constructor({
    id_compra,
    nit_proveedor,
    fecha_compra,
    fecha_aproximada_entrega,
    total_compra,
    estado
  }) {
    this.id_compra = id_compra
    this.nit_proveedor = nit_proveedor
    this.fecha_compra = fecha_compra
    this.fecha_aproximada_entrega = fecha_aproximada_entrega
    this.total_compra = total_compra
    this.estado = estado
  }
}
