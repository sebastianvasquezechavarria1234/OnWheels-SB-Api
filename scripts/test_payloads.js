
import axios from 'axios';

async function testPreinscription() {
    const token = "YOUR_VALID_TOKEN_HERE"; // Need a valid token to test
    // Since I can't easily get a valid token without login, I might need to simulate login first or use a known user.
    // Converting this to a simple payload printer for now to verify structure.

    const payloadPropia = {
        id_usuario: 1, // Mock
        enfermedad: "Ninguna",
        nivel_experiencia: "Basico",
        edad: 25,
        id_acudiente: null,
        tipo_preinscripcion: "PROPIA"
    };

    const payloadTercero = {
        id_usuario: 1, // Mock Parent
        enfermedad: "Asma",
        nivel_experiencia: "Intermedio",
        edad: 15,
        tipo_preinscripcion: "TERCERO",
        datos_tercero: {
            nombre_completo: "Hijo Test",
            email: "hijo_test_" + Date.now() + "@example.com",
            fecha_nacimiento: "2010-01-01"
        }
    };

    console.log("Payload PROPIA:", JSON.stringify(payloadPropia, null, 2));
    console.log("Payload TERCERO:", JSON.stringify(payloadTercero, null, 2));
}

testPreinscription();
