
#OnWheels-SB-Api

Cluster:
    UserName: Sebas1314
    Password: Nh0OzkmcKxHZt5yP


NetworkAccess(IP)
    Ip: 0.0.0.0/0
    Comment: Render deployment access


Link: mongodb+srv://Sebas1314:Nh0OzkmcKxHZt5yP@onwheels-cluster.uhnaulk.mongodb.net/?retryWrites=true&w=majority&appName=OnWheels-Cluster


------------------------------------------------------------------------

enpoint api/usuarios

{
  "name": "Sebas",
  "lastName": "Vasquez",
  "email": "sebas.garcia1@example.com",
  "phone": "3001231561",
  "role": "estudiante",
  "password": "Passwordsebas01"
}

------------------------------------------------------------------------

enpoint api/eventos

{
  "nombre": "Festival de Arte Juvenil",
  "descripcion": "Evento para mostrar el talento artístico de jóvenes locales.",
  "ubicacion": "Plaza Principal de VillaTiva",
  "direccion": "Calle 11 51-64",
  "hora": "15:00",
  "patrozinador": "Trazarte",
  "estado": "programado"
}

------------------------------------------------------------------------

enpoint api/productos

{
  "nombre": "Camisa OnWheels-SB ",
  "descripcion": "Descrpcion camisa",
  "categoria": "camisa",
  "marca": "PERFORMANS-SB",
  "precio": 18000,
  "stock": 25,
  "imagenes": [
    "https://ejemplo.com/imagenes/cuaderno1.jpg",
    "https://ejemplo.com/imagenes/cuaderno2.jpg"
  ]
}

------------------------------------------------------------------------

enpoint api/clases

{
  "nombre": "Clase de Skateboarding",
  "descripcion": "Introducción al skateboarding para estudiantes sin experiencia previa.",
  "instructor": "Laura Gómez",
  "nivel": "principiante",
  "horario": "18:00 - 20:00",
  "diasSemana": ["lunes", "miercoles", "viernes"],
  "ubicacion": "Sede VillaTiva - Aula 3",
  "estado": "activa"
}




CONSULTAS EN MONGO

db.clases.updateOne(
  { nombre: "Clase de Dibujo Básico" },
  { $set: { estado: "completa" } }
)

cambia el estado a completa


db.clases.deleteOne({ nombre: "Clase de Dibujo Básico" })


Elimina La clase