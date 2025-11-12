// models/Producto.js
export default class Producto {
  constructor({
    id_producto = null,
    id_categoria = null,
    nombre_producto = "",
    descripcion = "",
    precio_compra = 0,
    precio = 0,
    imagen_producto = "",
    estado = 1,
    porcentaje_ganancia = 0,
    descuento_producto = 0,
    talla = null,
    color_hex = null,
    stock = 0,
    nombre_categoria = null
  }) {
    this.id_producto = id_producto;
    this.id_categoria = id_categoria;
    this.nombre_producto = nombre_producto;
    this.descripcion = descripcion;
    this.precio_compra = precio_compra;
    this.precio = precio;
    this.imagen_producto = imagen_producto;
    this.estado = estado;
    this.porcentaje_ganancia = porcentaje_ganancia;
    this.descuento_producto = descuento_producto;
    this.talla = talla;
    this.color_hex = color_hex;
    this.stock = stock;
    this.nombre_categoria = nombre_categoria; // opcional, join con categoria
  }
}
