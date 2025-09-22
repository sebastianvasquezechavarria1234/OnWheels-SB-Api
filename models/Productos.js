class Producto {
  constructor({
    id_producto,
    id_categoria,
    nombre_producto,
    descripcion,
    precio_compra,
    imagen_producto,
    estado,
    porcentaje_ganancia,
    descuento_producto  
  }) {
    this.id_producto = id_producto
    this.id_categoria = id_categoria
    this.nombre_producto = nombre_productso
    this.descripcion = descripcion
    this.precio_compra = precio_compra
    this.imagen_producto = imagen_producto
    this.estado = estado
    this.porcentaje_ganancia = porcentaje_ganancia
    this.descuento_producto = descuento_producto
  }
}

export default Producto
