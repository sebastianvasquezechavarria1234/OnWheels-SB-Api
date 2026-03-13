import fs from 'fs';
import mockRes from 'express/lib/response.js';
import { uploadProfileImage } from './controllers/usuariosController.js';

// mock req
const req = {
  params: { id: '96' },
  file: {
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64"),
    originalname: 'test.png'
  }
};

const res = {
  status: (code) => ({
    json: (data) => {
      console.log(`STATUS ${code}:`, data);
    }
  }),
  json: (data) => console.log('JSON:', data)
};

uploadProfileImage(req, res).then(() => console.log('Done')).catch(console.error);

