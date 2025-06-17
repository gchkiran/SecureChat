
# 🔐 SecureChat

SecureChat is a real-time, end-to-end encrypted web chat application designed for secure intra-organization communication. Built using the MERN stack with WebCrypto API integration, SecureChat ensures that messages, files, and personal keys are encrypted and decrypted client-side — maintaining true zero-trust communication.

> 🟢 Live Demo: [https://securechat-5hch.onrender.com](https://securechat-5hch.onrender.com)

---

## 📁 Project Structure

```
SecureChat/
├── backend/          # Node.js, Express, MongoDB API
├── frontend/         # React, Zustand, TailwindCSS (Vite)
```

---

## 🚀 Features

- 🔑 End-to-end encrypted messaging (client-side RSA-OAEP, AES-GCM)
- 🏢 Organization-based multi-tenant chat system
- 📂 Secure file & media sharing via Cloudinary
- 🧠 Global state management using Zustand
- ⚡ Real-time messaging using Socket.io
- 🎨 Responsive UI with TailwindCSS + DaisyUI

---

## 🛠 Installation & Setup

### 1. Unzip the project


### 2. Setup Environment Variables

Create a `.env` file inside the `backend/` directory with your MongoDB URI and Cloudinary credentials:

```env
PORT=5000
MONGODB_URI=<your_mongo_cluster_uri>
CLOUDINARY_CLOUD_NAME=<your_cloud_name>
CLOUDINARY_API_KEY=<your_api_key>
CLOUDINARY_API_SECRET=<your_api_secret>
JWT_SECRET=<your_jwt_secret>
```

---

## 🧪 Running the Project Locally

### 🔁 Backend (Node.js + Express + MongoDB)

```bash
cd backend
npm install
npm run dev      # For development with nodemon
# or
npm start        # For production
```

### ⚛️ Frontend (React + Vite + Zustand)

```bash
cd frontend
npm install
npm run dev      # Starts frontend at http://localhost:5173
```

---

## 📦 Frontend Dependencies

Key libraries:
- `react`, `zustand`, `react-router-dom`, `tailwindcss`, `daisyui`
- `socket.io-client`, `axios`, `pdfjs-dist`, `@react-pdf-viewer/core`
- `@signalapp/libsignal-client`, `crypto-browserify`

Dev tools:
- `vite`, `eslint`, `autoprefixer`, `postcss`

---

## 🔧 Backend Dependencies

Key libraries:
- `express`, `mongoose`, `cors`, `dotenv`, `bcryptjs`, `jsonwebtoken`, `socket.io`
- `cloudinary`, `cookie-parser`

Dev tools:
- `nodemon`

---

## 🧾 Notes

- RSA key pairs are generated on the client using the WebCrypto API.
- Messages are dual-encrypted (once with the sender's key and once with the receiver's) and stored in MongoDB.
- Files are uploaded to Cloudinary and URLs are also encrypted before storage.
- All keys and private data are never exposed to the backend.

---

## 👨‍💻 Author

Made with ❤️ for Cryptography Coursework by Chandra Kiran Guntupalli
