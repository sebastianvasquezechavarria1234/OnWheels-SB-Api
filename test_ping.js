import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: 'dnsa9t7v1',
  api_key: '886132589611979',
  api_secret: 'mgJISvRsv12bcqBQsA2gP_FYsFM' // NOTE: uppercase I
});

cloudinary.api.ping()
  .then(res => console.log("PING SUCCESS (uppercase I):", res))
  .catch(err => console.error("PING ERROR (uppercase I):", err.error || err));

cloudinary.config({
  cloud_name: 'dnsa9t7v1',
  api_key: '886132589611979',
  api_secret: 'mgJlSvRsv12bcqBQsA2gP_FYsFM' // NOTE: lowercase L
});

cloudinary.api.ping()
  .then(res => console.log("PING SUCCESS (lowercase l):", res))
  .catch(err => console.error("PING ERROR (lowercase l):", err.error || err));
