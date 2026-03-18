import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';

// Create a dummy image file
fs.writeFileSync('dummy.jpg', Buffer.from('dummy image data'));

const form = new FormData();
form.append('imagen', fs.createReadStream('dummy.jpg'));

// login to get token
const login = async () => {
  try {
    const res = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@admin.com', // guess an admin email, wait I can't guess. Let's just create a valid token
      contrasena: 'admin123'
    });
    return res.data.token;
  } catch(e) {
    return null;
  }
}

// Just checking if we can run it.
