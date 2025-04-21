import express from "express";
import fs from "fs"; //permite trabajar con archivos en el sistema
import bodyParser from "body-parser"

const app = express();

app.use(bodyParser.json());


//Leer la data del archivo
const readData = () => {
    try {
        const data = fs.readFileSync("./db.json"); // La funcion readFileSync lee la data y es asincrona
        return JSON.parse(data)
    } catch (error) { 
        console.log("Error al intentar leer los datos", error)
    }
};

readData();

//Escribir en el archivo json
const writeData = (data) => {
    try {
        fs.writeFileSync("./db.json", JSON.stringify(data))
    } catch (error) {
        console.log("Error al escribir los datos", error)
    }
};


app.get("/", (req, respuesta) => {
    // se reciben los dos parametros
    respuesta.send("Bienvenido mi primera API con Nodejs! 🗿 ") // La respuesta readFileSync lee la data y es asincrona
});


//Usar los datos del archivo mediante rutas
app.get("/autos", (req, respuesta) => {
    const data = readData()
    respuesta.json(data.autos)
})


// Define una ruta GET para obtener un auto por su id
app.get("/autos/:id", (req, respuesta) => {
    //lee los datos de los autos
    const data = readData()

    //convierte el parametro de la URL (id) de string a numero entero
    const id = parseInt(req.params.id)

    // Busca el auto en la coleccion de autos usando el ID proporcionado
    const auto = data.autos.find((Auto) => Auto.id === id)

    // Devuelve el auto encontrado en formato JSON
    respuesta.json(auto);
});


// Define una ruta POST para agregar un nuevo auto
app.post("/autos", (req, respuesta) => {
    // Lee los archivos actuales de los autos 
    const data = readData();


    // Extrae el cuerpo de la solicitud (datos de el nuevo auto)
    const body = req.body;

    //Crea un nuevo objeto de el auto con ID unico
    const newCar = {
        id: data.autos.length + 1, // Asigna un ID basado en la longitud del array
        ...body, // Copia todas las propiedades enviadas en el cuerpo de la solicitud
    };

    
    // Agrega el nuevo auto
    data.autos.push(newCar);

    
    // Guarda los datos Actualizados
    writeData(data);


    //Responde con el nuevo auto recien creado en formato JSON
    respuesta.json(newCar)
});


// Actualizar
app.put("/autos/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const newCar = req.body;

    const index = data.autos.findIndex(p => p.id === id);
    if (index === -1) {
        return res.status(404).json({ mensaje: "Auto no encontrada" });
    }

    data.autos[index] = { id, ...newCar };
    writeData(data);

    res.json(data.autos[index]);
});


//Ruta para eliminar un auto por su ID
app.delete("/autos/:id", (req, respuesta) => {
    // leer los datos actuales
    const data = readData();

    //Obtener el ID de el auto que se va a eliminar desde los parametros de la URL y convertirlo a numero
    const id = parseInt(req.params.id);

    // Buscar el indice de el auto en el array de autos usando el ID
    const CarIndex = data.autos.findIndex((Auto) => Auto.id === id);

    // Si el auto existe, se limina de el array usando Splice
    data.autos.splice(CarIndex, 1);

    // Guardamos los datos actualizados desepues de la eliminación
    writeData(data)

    // Se envia una respuesta JSON indicando que el libro fue eliminado con éxito
    respuesta.json({ message: "El Auto fue eliminada Correctamente!" });
});


//La app espera la solicitud
app.listen(3000, () => {
    console.log("El servidor esta levantado en el puerto 3000 ");
});