# Getting Started Guide

**Quick setup instructions for Secure-Chat-WebAuthn**

---

## ⚡ Quick Start (5 minutes)

### Prerequisites
- Node.js 18+ ([download](https://nodejs.org/))
- MongoDB ([local](https://docs.mongodb.com/manual/installation/) or [cloud](https://www.mongodb.com/cloud/atlas))
- Git

### Option 1: Local Development (Recommended)

```bash
# Clone repository
git clone https://github.com/mabbasrz/Secure-Chat-WebAuthn.git
cd Secure-Chat-WebAuthn

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env - set your MongoDB URI
npm start

# In another terminal: Frontend setup
cd frontend
npm install
npm run dev

# Visit http://localhost:5173
```

### Option 2: Docker (One Command)

```bash
# Start everything
docker-compose up --build

# Services running:
# Frontend: http://localhost:5173
# Backend: http://localhost:5000
# MongoDB: mongodb://localhost:27017
```

---

## 🔧 Configuration

### Backend `.env`

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/secure-chat

# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars-here
JWT_EXPIRE=24h

# WebAuthn
RP_ID=localhost
RP_NAME=Secure Chat
ORIGIN=http://localhost:5000
```

### Frontend `.env`

```bash
# API
VITE_API_URL=http://localhost:5000
```

---

## 🚀 First Steps

### 1. Create Account
- Open http://localhost:5173/register
- Enter username & email
- Follow biometric registration (Windows Hello, Touch ID, Face ID, or security key)
- Done! Account created.

### 2. Login
- Go to http://localhost:5173/login
- Enter username
- Use biometric to authenticate
- Automatically directed to chat

### 3. Start Chatting
- Click a user from online list
- Type message
- Hit Send (or Shift+Enter for new line)
- Message is encrypted client-side and sent

---

## 📂 Project Layout

```
Secure-Chat-WebAuthn/
├── backend/              # Node.js + Express server
│   └── src/
│       ├── index.js      # Main server file
│       ├── models/       # MongoDB schemas
│       ├── routes/       # API endpoints
│       ├── middleware/   # Auth, errors
│       └── utils/        # Encryption helpers
├── frontend/             # React + Vite app
│   └── src/
│       ├── pages/        # LoginPage, RegisterPage, ChatPage
│       ├── components/   # ChatWindow, UserList, MessageInput
│       ├── hooks/        # useAuth, useSocket, useCrypto
│       ├── context/      # AuthContext
│       └── App.jsx       # Router
├── docker-compose.yml    # Local dev orchestration
└── README.md            # Full documentation
```

---

## 🧪 Development Commands

### Backend

```bash
cd backend

# Development (auto-reload)
npm run dev

# Production
npm start

# Tests
npm test

# Linting
npm run lint
```

### Frontend

```bash
cd frontend

# Development (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Tests
npm test

# Linting
npm run lint
```

---

## 🔍 Testing the App

### Manual Testing

1. **Register two accounts** on different browsers/devices
2. **Login** to both accounts
3. **Start conversation** - select other user and type message
4. **Verify encryption** - open DevTools → Network → check encrypted content
5. **Test online status** - watch user list update in real-time
6. **Test typing indicator** - see "..." when other user types

### API Testing with cURL

```bash
# Get registration options
curl -X POST http://localhost:5000/api/auth/register/options \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com"}'

# Get login options
curl -X POST http://localhost:5000/api/auth/login/options \
  -H "Content-Type: application/json" \
  -d '{"username":"alice"}'

# Get health status
curl http://localhost:5000/api/health
```

---

## 🐛 Troubleshooting

### "MongoDB connection error"
- Ensure MongoDB is running: `mongo --version`
- Check `MONGODB_URI` in `.env`
- If using MongoDB Atlas, check IP whitelist and password

### "WebAuthn not supported"
- Using Safari on non-Mac? Not supported yet.
- Use Chrome, Firefox, or Edge 67+
- On mobile, use biometric-capable Android device

### "Messages not encrypting"
- Check browser console for errors
- Ensure `@simplewebauthn/browser` installed
- Refresh page and try again

### "Socket.IO connection refused"
- Verify backend is running on port 5000
- Check `FRONTEND_URL` matches your domain
- Check `CORS` settings in backend/src/index.js

### "Port already in use"
```bash
# Change port in .env
PORT=5001

# Or kill process using port
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows
```

---

## 📊 Monitoring

### Backend Logs

```bash
# Run with detailed logging
NODE_ENV=development npm start

# Look for:
# [DB] MongoDB connected
# [Server] Listening on port 5000
# [Socket] User connected: socket-id
# [Socket] Message from user...
```

### Frontend Logs

Open browser DevTools (F12 → Console)

```javascript
// Check auth status
sessionStorage.getItem('auth_token')

// Check encryption keys
sessionStorage.getItem('naCl_secretKey')

// Monitor Socket.IO events
// (see Network tab → WS for WebSocket messages)
```

---

## 🔐 Security Best Practices

### Development
- ✅ Use `HTTPS` locally (self-signed cert)
- ✅ Regenerate `JWT_SECRET` (strong random key)
- ✅ Never commit `.env` file
- ✅ Keep dependencies updated (`npm audit fix`)

### Production
- ✅ Set `NODE_ENV=production`
- ✅ Use trusted SSL/TLS certificate (Let's Encrypt)
- ✅ Enable rate limiting (configured)
- ✅ Use strong `JWT_SECRET` (32+ chars, random)
- ✅ Set restrictive CORS origin
- ✅ Configure MongoDB firewall rules
- ✅ Enable MongoDB authentication
- ✅ Use environment variables for all secrets
- ✅ Set up monitoring and alerts
- ✅ Regular backups of MongoDB

---

## 🚀 Deployment

### Vercel (Frontend)

```bash
npm run build
# Push to GitHub
# Vercel auto-deploys from main branch
# Set VITE_API_URL environment variable
```

### Railway/Render (Backend)

```bash
# Connect GitHub repo
# Set environment variables:
# - MONGODB_URI
# - JWT_SECRET
# - FRONTEND_URL
# - RP_ID, RP_NAME, ORIGIN
# Auto-deploys from main branch
```

### Self-Hosted

```bash
# Build images
docker build -t secure-chat-backend ./backend
docker build -t secure-chat-frontend ./frontend

# Push to registry (Docker Hub, etc.)
docker push <username>/secure-chat-backend
docker push <username>/secure-chat-frontend

# Deploy with docker-compose on server
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📚 Learning Resources

### WebAuthn
- [MDN - WebAuthn API](https://developer.mozilla.org/en-US/docs/Web/API/WebAuthn_API)
- [SimpleWebAuthn Docs](https://simplewebauthn.dev/)
- [FIDO2 Specification](https://fidoalliance.org/fido2/)

### Cryptography
- [NaCl (libsodium) Overview](https://nacl.cr.yp.to/)
- [TweetNaCl.js Docs](https://tweetnacl.js.org/)
- [NIST Cryptography Standards](https://csrc.nist.gov/publications/detail/sp/800-38d/final)

### MERN Stack
- [MongoDB Docs](https://docs.mongodb.com/)
- [Express Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://react.dev/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-web-app-automate-ORM-sequelize-postgre/)

### Socket.IO
- [Socket.IO Official Docs](https://socket.io/docs/v4/)
- [Real-time Communication Guide](https://www.geeksforgeeks.org/introduction-to-websockets/)

---

## 💡 Tips & Tricks

### Local Testing Multiple Users
```bash
# Terminal 1: Backend
npm start

# Terminal 2: Frontend (default 5173)
npm run dev

# Terminal 3: Frontend (different port)
PORT=5174 npm run dev

# Open 2 browser tabs with different ports
```

### Database Reset
```bash
# Clear all data (development only)
db.dropDatabase()  # In MongoDB shell

# Or use MongoDB Compass GUI
```

### Debug WebAuthn
```javascript
// In browser console before registration
console.log(navigator.credentials);  // Should show WebAuthn support
```

### Monitor Socket.IO
```javascript
// In browser console
localStorage.setItem('debug', '*');  // Enable all debug logs
```

---

## 🤝 Contributing

Want to improve the project?

1. **Fork** the repository
2. **Create feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m 'feat: add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open Pull Request**

See [SECURITY.md](./SECURITY.md) for responsible disclosure.

---

## 📞 Support

- **Documentation:** See README.md and SECURITY.md
- **Issues:** [GitHub Issues](https://github.com/mabbasrz/Secure-Chat-WebAuthn/issues)
- **Email:** mabbasrz@github.local
- **GitHub:** [@mabbasrz](https://github.com/mabbasrz)

---

## 📋 Checklist: Before Going Live

- [ ] Set strong `JWT_SECRET`
- [ ] Configure MongoDB authentication
- [ ] Use HTTPS/WSS in production
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origin
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Enable rate limiting
- [ ] Set up backups
- [ ] Test on production URLs
- [ ] Monitor logs and alerts
- [ ] Document deployment process
- [ ] Set up CDN for static assets

---

**Happy coding! 🚀**

*Last Updated: November 7, 2025*
