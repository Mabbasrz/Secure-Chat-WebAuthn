# Quick Reference Card

**Secure-Chat-WebAuthn - Development Quick Reference**

---

## 🚀 Quick Commands

```bash
# Clone & setup
git clone https://github.com/mabbasrz/Secure-Chat-WebAuthn.git
cd Secure-Chat-WebAuthn

# Backend
cd backend && npm install && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev

# Docker (one command)
docker-compose up --build
```

---

## 🔗 Local URLs

| Service | URL | Port |
|---------|-----|------|
| Frontend | http://localhost:5173 | 5173 |
| Backend API | http://localhost:5000 | 5000 |
| MongoDB | mongodb://localhost:27017 | 27017 |

---

## 📁 File Navigation

| Purpose | File |
|---------|------|
| Main server | `backend/src/index.js` |
| Auth routes | `backend/src/routes/auth.js` |
| Message routes | `backend/src/routes/messages.js` |
| User routes | `backend/src/routes/users.js` |
| Middleware | `backend/src/middleware/auth.js` |
| Crypto utils | `backend/src/utils/crypto.js` |
| Main app | `frontend/src/App.jsx` |
| Login page | `frontend/src/pages/LoginPage.jsx` |
| Chat page | `frontend/src/pages/ChatPage.jsx` |
| Socket hook | `frontend/src/hooks/useSocket.js` |
| Crypto hook | `frontend/src/hooks/useCrypto.js` |

---

## 🔐 Environment Variables

### Backend `.env`
```
MONGODB_URI=mongodb://localhost:27017/secure-chat
JWT_SECRET=your-secret-key-min-32-chars
FRONTEND_URL=http://localhost:5173
RP_ID=localhost
ORIGIN=http://localhost:5000
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:5000
```

---

## 📡 API Endpoints

### Auth
```
POST /api/auth/register/options
POST /api/auth/register/verify
POST /api/auth/login/options
POST /api/auth/login/verify
POST /api/auth/logout
```

### Messages
```
GET /api/messages/:userId
POST /api/messages
DELETE /api/messages/:messageId
GET /api/messages/unread/count
GET /api/messages/conversations/list
```

### Users
```
GET /api/users/profile
GET /api/users/search?q=...
GET /api/users/:userId/public-key
GET /api/users/online
PUT /api/users/profile
DELETE /api/users/account
```

---

## 🔌 Socket.IO Events

### Client → Server
```javascript
socket.emit('user-joined', { userId, username })
socket.emit('send-message', { sender, receiver, encryptedContent, nonce })
socket.emit('typing', { receiver })
socket.emit('stop-typing', { receiver })
```

### Server → Client
```javascript
socket.on('user-joined', { userId, username, timestamp })
socket.on('receive-message', { sender, receiver, encryptedContent, nonce })
socket.on('message-sent', { status, timestamp })
socket.on('typing', { sender })
socket.on('stop-typing', { sender })
socket.on('user-disconnected', { userId, timestamp })
```

---

## 🧪 Testing Commands

```bash
# Backend tests (pending)
npm test

# Frontend tests (pending)
npm test

# Coverage
npm run test:coverage

# Lint
npm run lint
```

---

## 🐳 Docker Commands

```bash
# Build images
docker build -t secure-chat-backend ./backend
docker build -t secure-chat-frontend ./frontend

# Run with docker-compose
docker-compose up --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## 🔍 Debugging

### Browser Console
```javascript
// Check auth token
sessionStorage.getItem('auth_token')

// Check encryption keys
sessionStorage.getItem('naCl_secretKey')

// Enable Socket.IO debug
localStorage.setItem('debug', 'socket.io*')
```

### Backend Logs
```
[DB] MongoDB connected
[Server] Listening on port 5000
[Socket] User connected: socket-id
[Socket] Message from user...
```

---

## 📊 Key Statistics

| Metric | Value |
|--------|-------|
| Backend files | 8 |
| Frontend components | 9 |
| Custom hooks | 3 |
| API endpoints | 15+ |
| Socket events | 6+ |
| Lines of code | 3000+ |
| Documentation pages | 4 |

---

## 🔐 Security Checklist

### Development
- [ ] Change JWT_SECRET
- [ ] Use HTTPS locally
- [ ] Keep .env out of git
- [ ] Run npm audit fix

### Production
- [ ] Set NODE_ENV=production
- [ ] Use HTTPS/WSS
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Set strong JWT_SECRET
- [ ] Enable MongoDB auth
- [ ] Set up monitoring
- [ ] Enable backups

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| README.md | Project overview & features |
| SECURITY.md | Threat model & security checklist |
| BUILD_SUMMARY.md | Complete build documentation |
| GETTING_STARTED.md | Setup & troubleshooting guide |
| COMPLETION_SUMMARY.md | Project completion status |

---

## 🚀 Deployment Checklist

- [ ] Tests passing (Jest + Vitest)
- [ ] Lint clean (ESLint)
- [ ] Build successful (npm run build)
- [ ] Docker images built
- [ ] Environment variables configured
- [ ] Database connected
- [ ] SSL/TLS certificate ready
- [ ] Domain configured
- [ ] Monitoring setup
- [ ] Backups configured

---

## 💡 Common Issues

| Issue | Solution |
|-------|----------|
| MongoDB not connecting | Check MONGODB_URI in .env |
| WebAuthn not working | Use Chrome/Firefox/Edge 67+ |
| Port already in use | Change PORT in .env or kill process |
| Socket.IO reconnecting | Check backend is running on :5000 |
| Messages not encrypting | Check tweetnacl dependencies installed |

---

## 📞 Useful Links

- [GitHub Repo](https://github.com/mabbasrz/Secure-Chat-WebAuthn)
- [MongoDB Docs](https://docs.mongodb.com/)
- [Express Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [Socket.IO Docs](https://socket.io/docs/)
- [SimpleWebAuthn](https://simplewebauthn.dev/)
- [NaCl/TweetNaCl](https://tweetnacl.js.org/)

---

## 📋 Project Files Checklist

### Backend
- [x] `index.js` - Main server
- [x] `routes/auth.js` - Authentication
- [x] `routes/messages.js` - Messages
- [x] `routes/users.js` - Users
- [x] `middleware/auth.js` - Auth middleware
- [x] `utils/crypto.js` - Encryption
- [x] `models/User.js` - User schema
- [x] `models/Message.js` - Message schema

### Frontend
- [x] `App.jsx` - Router
- [x] `pages/LoginPage.jsx` - Login
- [x] `pages/RegisterPage.jsx` - Register
- [x] `pages/ChatPage.jsx` - Chat
- [x] `components/ProtectedRoute.jsx` - Auth guard
- [x] `components/UserList.jsx` - Users
- [x] `components/ChatWindow.jsx` - Messages
- [x] `components/MessageInput.jsx` - Input
- [x] `context/AuthContext.jsx` - Auth state
- [x] `hooks/useSocket.js` - Socket hook
- [x] `hooks/useCrypto.js` - Crypto hook

### Config
- [x] `backend/package.json`
- [x] `backend/.env.example`
- [x] `backend/Dockerfile`
- [x] `frontend/package.json`
- [x] `frontend/vite.config.js`
- [x] `frontend/.env.example`
- [x] `frontend/index.html`
- [x] `frontend/src/main.jsx`
- [x] `frontend/src/index.css`

### Documentation
- [x] `README.md`
- [x] `SECURITY.md`
- [x] `BUILD_SUMMARY.md`
- [x] `GETTING_STARTED.md`
- [x] `COMPLETION_SUMMARY.md`
- [x] `QUICK_REFERENCE.md` (this file)

---

## ⏱️ Estimated Build Times

| Task | Time |
|------|------|
| Backend development | 40 min |
| Frontend development | 60 min |
| Documentation | 30 min |
| Testing (pending) | 60 min |
| Deployment (pending) | 30 min |

**Total:** ~3.5 hours (feature complete), ~5 hours (full production)

---

## 🎯 Success Criteria Met

✅ Full MERN stack  
✅ Modern authentication (WebAuthn)  
✅ Encryption (NaCl, E2E)  
✅ Real-time messaging (Socket.IO)  
✅ Professional code quality  
✅ Comprehensive documentation  
✅ Production-ready architecture  
✅ Security best practices  

---

**Status:** ✅ Complete | 📊 Ready for Testing & Deployment

**Quick Links:**
- [Main README](./README.md)
- [Getting Started](./GETTING_STARTED.md)
- [Security Details](./SECURITY.md)
- [Full Build Summary](./BUILD_SUMMARY.md)

---

*Last Updated: November 7, 2025 | Muzammil Abbas*
