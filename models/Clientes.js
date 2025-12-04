module.exports = class Cliente {
  constructor({
    id_cliente,
    id_usuario,
    direccion_envio,
    telefono_contacto,
    metodo_pago,
    documento,
    tipo_documento
  }) {
    this.id_cliente = id_cliente;
    this.id_usuario = id_usuario;
    this.direccion_envio = direccion_envio;
    this.telefono_contacto = telefono_contacto;
    this.metodo_pago = metodo_pago;
    this.documento = documento;
    this.tipo_documento = tipo_documento;
  }
};