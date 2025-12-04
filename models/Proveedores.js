// models/Proveedores.js
export default class Proveedor {
  constructor({
    nit,
    nombre_proveedor,
    email,
    telefono,
    direccion
  }) {
    this.nit = nit;
    this.nombre_proveedor = nombre_proveedor;
    this.email = email;
    this.telefono = telefono;
    this.direccion = direccion;
  }
}
