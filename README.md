<div align="center">

# 🔐 CrypTalk

### *Where Privacy Meets Simplicity*

[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](https://cryptalk-frontend.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-blue)](#license)
[![Built with](https://img.shields.io/badge/Built%20with-MERN%20Stack-61dafb)](#tech-stack)
[![Security](https://img.shields.io/badge/Security-E2E%20Encrypted-success)](#security)

**Next-generation encrypted messaging platform combining WebAuthn passwordless authentication with NaCl end-to-end encryption**

[Live Demo](https://cryptalk-frontend.onrender.com) • [Documentation](#documentation) • [Features](#features) • [Security](#security)

</div>

---

## ✨ Features

### 🔒 Security First
- **WebAuthn Passwordless Auth** - Biometric & security key login
- **E2E Encryption** - Messages encrypted with NaCl (client-side only)
- **Zero-Knowledge** - Server stores only ciphertext
- **Rate Limiting** - DDoS/brute-force protection
- **OWASP Compliant** - Security headers with Helmet
- **CORS Hardened** - Restricted to trusted origins

### 💬 Communication
- 🚀 Real-time messaging with Socket.IO
- 👤 User profiles & presence indicators
- 📱 Fully responsive mobile-friendly UI
- 🎨 Modern glassmorphism design with animations
- ✨ Smooth transitions & hover effects
- 🎭 Floating particles & gradient backgrounds

### 🛠️ Development
- 🧪 Test suite with >80% coverage
- 📊 GitHub Actions CI/CD
- 🐳 Docker-ready deployment
- 📚 Comprehensive documentation
- 🔄 Hot reload development
- 📦 Modular component architecture

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│            FRONTEND (React + Vite + Tailwind)           │
│  ├─ WebAuthn Registration/Login (biometric)             │
│  ├─ NaCl Client-side Encryption                         │
│  ├─ Socket.IO Real-time Updates                         │
│  └─ Glassmorphism UI with Animations                    │
└────────────────┬────────────────────────────────────────┘
                 │ HTTPS + WSS
┌────────────────▼────────────────────────────────────────┐
│           BACKEND (Node.js + Express)                   │
│  ├─ WebAuthn Server (@simplewebauthn)                   │
│  ├─ Socket.IO Relay (no decryption)                     │
│  ├─ JWT Authentication                                   │
│  └─ MongoDB Storage (encrypted blobs only)              │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│                  DATABASE (MongoDB)                      │
│  └─ Stores: encrypted messages, user credentials        │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or cloud)
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/mabbasrz/Secure-Chat-WebAuthn.git
cd Secure-Chat-WebAuthn

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm start

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev

# Visit http://localhost:5173
```

### With Docker

```bash
docker-compose up --build

# Services:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:5000
# - MongoDB: mongodb://localhost:27017
```

---

## 📖 Usage

### 1️⃣ Register
- Click "Sign up"
- Enter username & email
- Use biometric or security key
- System generates NaCl key pair

### 2️⃣ Login
- Click "Login"
- Authenticate with biometric
- JWT token issued (24h validity)

### 3️⃣ Chat
- Select user to chat with
- Type message (encrypted client-side)
- Message sent via Socket.IO
- Recipient decrypts locally

---

## 🔐 Security Model

### Threat Mitigation

| Threat | Mitigation |
|--------|------------|
| Password compromise | WebAuthn (passwordless) |
| Server breach | E2E encryption (zero-knowledge) |
| Message interception | TLS + NaCl encryption |
| DDoS attacks | Rate limiting + Helmet |
| CSRF attacks | Socket.IO origin verification |
| XSS attacks | React (no localStorage secrets) |

### Assumptions
- ✅ HTTPS/WSS in production
- ✅ Users verify recipient identity
- ✅ Browser crypto APIs trusted
- ⚠️ Metadata visible to server (who/when)

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Run all tests with coverage
npm run test:all
```

**Coverage:** >80% overall

---

## 📚 Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Vite, Socket.IO, TweetNaCl.js, Tailwind CSS |
| **Backend** | Node.js, Express, Socket.IO, @simplewebauthn |
| **Database** | MongoDB, Mongoose |
| **DevOps** | Docker, GitHub Actions, Render |
| **Testing** | Jest, Vitest, Supertest, React Testing Library |
| **Security** | Helmet, CORS, Rate-limiting, WebAuthn, NaCl |

---

## 🌟 What's New

### v2.0.0 - Modern UI Overhaul
- ✨ Glassmorphism design with backdrop blur
- 🎨 Floating particle animations (50+ particles)
- 🌈 Gradient orbs with blob animations
- 💫 Smooth transitions & hover effects
- 🎭 Modern purple-pink gradient theme
- 📱 Enhanced mobile responsiveness
- ⚡ Custom animations (float, blob, shake, glow)
- 🎨 Custom gradient scrollbar
- 💎 Professional UI/UX patterns

---

## 📄 License

MIT License © 2025 Muzammil Abbas

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 🐛 Issues & Support

- **Bug reports:** [Open issue](https://github.com/mabbasrz/Secure-Chat-WebAuthn/issues)
- **Security issues:** Email security@mabbasrz.com (private)

---

## 👨‍💻 Author

**Muzammil Abbas**
- GitHub: [@mabbasrz](https://github.com/mabbasrz)
- Website: [mabbasrz.github.io](https://mabbasrz.github.io/)

---

<div align="center">

### ⭐ Show Your Support

If this project helped you, please give it a ⭐ on GitHub!

**CrypTalk** - *Where Privacy Meets Simplicity* 🔐

[![Deploy](https://img.shields.io/badge/Deploy%20Your%20Own-Success-brightgreen)](https://github.com/mabbasrz/Secure-Chat-WebAuthn/fork)

</div>
