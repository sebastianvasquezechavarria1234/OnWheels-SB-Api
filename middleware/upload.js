import multer from "multer";
import path from "path";

// Usamos almacenamiento en memoria, multer guardará el archivo en un buffer
// para que luego lo enviemos directamente a Cloudinary sin guardarlo en disco.
const storage = multer.memoryStorage();

// Validamos que el archivo subido sea una imagen
const fileFilter = (req, file, cb) => {
    const allowedExtensions = /jpeg|jpg|png|webp|gif/;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedExtensions.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error("Solo se permiten archivos de imagen (jpeg, jpg, png, webp, gif)"));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB MAX
});

export default upload;
