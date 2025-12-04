module.exports = class Administrador {
  constructor({
    id_admin,
    id_usuario,
    tipo_admin,
    area
  }) {
    this.id_admin = id_admin;
    this.id_usuario = id_usuario;
    this.tipo_admin = tipo_admin;
    this.area = area;
  }
};