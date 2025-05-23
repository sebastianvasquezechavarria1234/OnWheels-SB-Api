import express from "express";
import fs from "fs";
import bodyParser from "body-parser";
import cors from "cors";


const app = express();
app.use(bodyParser.json());
app.use(cors());

const readData = () => {
    try {
        const data = fs.readFileSync("./db.json");
        return JSON.parse(data);
    } catch (error) {
        console.log("Error al intentar leer los datos", error);
    }
};

const writeData = (data) => {
    try {
        fs.writeFileSync("./db.json", JSON.stringify(data));
    } catch (error) {
        console.log("Error al escribir los datos", error);
    }
};

app.get("/", (req, res) => {
    res.send("Bienvenido mi primera API con Nodejs! 🗿");
});

// ======================== CRUD AUTOS ========================

app.get("/autos", (req, res) => {
    const data = readData();
    res.json(data.autos);
});

app.get("/autos/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const auto = data.autos.find((a) => a.id === id);
    res.json(auto);
});

app.post("/autos", (req, res) => {
    const data = readData();
    const body = req.body;
    const newCar = {
        id: data.autos.length + 1,
        ...body,
    };
    data.autos.push(newCar);
    writeData(data);
    res.json(newCar);
});

app.put("/autos/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const updatedCar = req.body;

    const index = data.autos.findIndex((a) => a.id === id);
    if (index === -1) {
        return res.status(404).json({ mensaje: "Auto no encontrado" });
    }

    data.autos[index] = { id, ...updatedCar };
    writeData(data);
    res.json(data.autos[index]);
});

app.delete("/autos/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const index = data.autos.findIndex((a) => a.id === id);
    data.autos.splice(index, 1);
    writeData(data);
    res.json({ message: "El Auto fue eliminado correctamente!" });
});

// ======================== CRUD USUARIOS ========================

app.get("/usuarios", (req, res) => {
    const data = readData();
    res.json(data.usuarios);
});

app.get("/usuarios/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const usuario = data.usuarios.find((u) => u.id === id);
    res.json(usuario);
});

app.post("/usuarios", (req, res) => {
    const data = readData();
    const body = req.body;
    const newUser = {
        id: data.usuarios.length + 1,
        ...body,
    };
    data.usuarios.push(newUser);
    writeData(data);
    res.json(newUser);
});

app.put("/usuarios/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const updatedUser = req.body;

    const index = data.usuarios.findIndex((u) => u.id === id);
    if (index === -1) {
        return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    data.usuarios[index] = { id, ...updatedUser };
    writeData(data);
    res.json(data.usuarios[index]);
});

app.delete("/usuarios/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const index = data.usuarios.findIndex((u) => u.id === id);
    data.usuarios.splice(index, 1);
    writeData(data);
    res.json({ message: "El Usuario fue eliminado correctamente!" });
});




// ======================== CRUD EVENTOS ========================

app.get("/eventos", (req, res) => {
    const data = readData();
    res.json(data.eventos);
});

app.get("/eventos/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const eventos = data.eventos.find((e) => e.id === id);
    res.json(eventos);
});

app.post("/eventos", (req, res) => {
    const data = readData();
    const body = req.body;
    const newEvento = {
        id: data.eventos.length + 1,
        ...body,
    };
    data.eventos.push(newEvento);
    writeData(data);
    res.json(newEvento);
});

app.put("/eventos/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const updateEventos = req.body;

    const index = data.eventos.findIndex((e) => e.id === id);
    if (index === -1) {
        return res.status(404).json({ mensaje: "El evento no ha sido encontrado" });
    }

    data.eventos[index] = { id, ...updateEventos };
    writeData(data);
    res.json(data.eventos[index]);
});

app.delete("/eventos/:id", (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const index = data.eventos.findIndex((e) => e.id === id);

     if (index === -1) {
        return res.status(404).json({ message: "Evento no encontrado" });
    }
    
    data.eventos.splice(index, 1);
    writeData(data);
    res.json({ message: "El evento fue eliminado correctamente!" });
});


// Servidor
app.listen(3000, () => {
    console.log("La API está levantada en el puerto 3000");
});
