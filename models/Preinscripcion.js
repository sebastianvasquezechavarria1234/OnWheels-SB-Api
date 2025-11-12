// models/Preinscripcion.js
export default class Preinscripcion {
  constructor({ id_preinscripcion, id_usuario, id_acudiente, edad, otra_enfermedad }) {
    this.id_preinscripcion = id_preinscripcion;
    this.id_usuario = id_usuario;
    this.id_acudiente = id_acudiente;
    this.edad = edad;
    this.otra_enfermedad = otra_enfermedad;
  }
}
