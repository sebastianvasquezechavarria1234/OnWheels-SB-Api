class Venta {
  constructor({ id_venta, id_usuario, metodo_pago, estado, fecha_venta }) {
    this.id_venta = id_venta;
    this.id_usuario = id_usuario;
    this.metodo_pago = metodo_pago;
    this.estado = estado;
    this.fecha_venta = fecha_venta;
  }
}

export default Venta;
