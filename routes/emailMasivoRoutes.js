import express from "express";
import { enviarCorreosMasivos } from "../controllers/emailMasivoController.js";

const router = express.Router();

router.post("/correos", enviarCorreosMasivos);

export default router;
