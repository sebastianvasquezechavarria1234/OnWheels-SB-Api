class Venta {
  constructor({ id_venta, id_usuario, metodo_pago, estado_venta, fecha_venta }) {
    this.id_venta = id_venta;
    this.id_usuario = id_usuario;
    this.metodo_pago = metodo_pago;
    this.estado_venta = estado_venta;
    this.fecha_venta = fecha_venta;
  }
}

export default Venta;
