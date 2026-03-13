import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config({ override: true });

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log("Cloudinary config:");
console.log("  cloud_name:", cloudName);
console.log("  api_key:", apiKey ? "Set" : "MISSING");
console.log("  api_secret:", apiSecret ? `Set (length=${apiSecret.length})` : "MISSING");

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
});

export default cloudinary;
