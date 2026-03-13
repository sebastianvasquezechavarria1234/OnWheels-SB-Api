import dotenv from "dotenv";
dotenv.config();
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log("Values:");
console.log("Cloud:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("Key:", process.env.CLOUDINARY_API_KEY);
console.log("Secret:", process.env.CLOUDINARY_API_SECRET ? "exists": "missing");

const buf = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
console.log("Uploading...");
const st = cloudinary.uploader.upload_stream({folder: 'test'}, (err, res) => {
  if (err) console.error("Error:", err);
  else console.log("OK:", res.secure_url);
});
st.end(buf);
