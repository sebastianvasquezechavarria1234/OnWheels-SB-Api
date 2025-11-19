// models/Productos.js
export default class Producto {
  constructor({
    id_producto,
    id_categoria,
    nombre_producto,
    descripcion,
    precio_compra,
    precio,
    imagen_producto,
    estado,
    porcentaje_ganancia,
    descuento_producto,
    categoria_nombre
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
    this.categoria_nombre = categoria_nombre;
  }
}
