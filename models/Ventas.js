class Venta {
  constructor({ id_venta, id_usuario, id_metodo_pago, estado_venta, fecha_venta }) {
    this.id_venta = id_venta
    this.id_usuario = id_usuario
    this.id_metodo_pago = id_metodo_pago
    this.estado_venta = estado_venta
    this.fecha_venta = fecha_venta
  }
}

export default Venta
