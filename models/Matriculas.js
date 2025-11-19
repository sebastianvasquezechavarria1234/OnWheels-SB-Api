class Matricula {
  constructor({
    id_matricula,
    id_estudiante,
    id_clase,
    id_plan,
    fecha_matricula,
    estado
  }) {
    this.id_matricula = id_matricula;
    this.id_estudiante = id_estudiante;
    this.id_clase = id_clase;
    this.id_plan = id_plan;
    this.fecha_matricula = fecha_matricula;
    this.estado = estado;
  }
}

export default Matricula;
