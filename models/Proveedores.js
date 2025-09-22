export default class Proveedor {
  constructor({ NIT_proveedor, nombre_proveedor, email, telefono, direccion }) {
    this.NIT_proveedor = NIT_proveedor
    this.nombre_proveedor = nombre_proveedor
    this.email = email
    this.telefono = telefono
    this.direccion = direccion
  }
}
