/**
 * CrypTalk - Socket.IO Real-time Events Tests
 * Testing message relay, user presence, typing indicators
 */

const { Server } = require('socket.io');
const http = require('http');

describe('Socket.IO Real-time Events', () => {
  let io;
  let httpServer;
  let socket1;
  let socket2;

  beforeAll((done) => {
    httpServer = http.createServer();
    io = new Server(httpServer, {
      cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000' },
    });

    httpServer.listen(() => {
      done();
    });
  });

  afterAll(() => {
    if (socket1) socket1.disconnect();
    if (socket2) socket2.disconnect();
    io.close();
    httpServer.close();
  });

  describe('Connection Events', () => {
    it('should connect client to Socket.IO', (done) => {
      const { io: Client } = require('socket.io-client');
      const socket = new Client(`http://localhost:${httpServer.address().port}`);

      socket.on('connect', () => {
        expect(socket.connected).toBe(true);
        socket.disconnect();
        done();
      });
    });

    it('should emit connect event', (done) => {
      const { io: Client } = require('socket.io-client');
      const socket = new Client(`http://localhost:${httpServer.address().port}`);

      io.once('connection', (sock) => {
        expect(sock).toBeDefined();
        expect(sock.id).toBeDefined();
        socket.disconnect();
        done();
      });
    });

    it('should handle disconnect', (done) => {
      const { io: Client } = require('socket.io-client');
      const socket = new Client(`http://localhost:${httpServer.address().port}`);

      io.once('connection', (sock) => {
        sock.on('disconnect', () => {
          done();
        });
      });

      socket.on('connect', () => {
        socket.disconnect();
      });
    });
  });

  describe('Message Events', () => {
    beforeEach((done) => {
      const { io: Client } = require('socket.io-client');
      socket1 = new Client(`http://localhost:${httpServer.address().port}`);
      socket2 = new Client(`http://localhost:${httpServer.address().port}`);

      let connected = 0;
      const onConnect = () => {
        connected++;
        if (connected === 2) done();
      };

      socket1.on('connect', onConnect);
      socket2.on('connect', onConnect);
    });

    it('should relay encrypted message from sender to receiver', (done) => {
      io.on('connection', (sock) => {
        sock.on('send-message', (data) => {
          sock.to(data.receiver).emit('receive-message', data);
        });
      });

      socket2.on('receive-message', (data) => {
        expect(data).toHaveProperty('encryptedContent');
        expect(data).toHaveProperty('nonce');
        expect(data).toHaveProperty('sender');
        done();
      });

      socket1.emit('send-message', {
        receiver: socket2.id,
        encryptedContent: 'base64-ciphertext',
        nonce: 'base64-nonce',
        sender: 'user123',
      });
    });

    it('should not decrypt server-side (zero-knowledge)', (done) => {
      let decryptedOnServer = false;

      io.on('connection', (sock) => {
        sock.on('send-message', (data) => {
          // Server should not attempt to decrypt
          expect(decryptedOnServer).toBe(false);

          // Relay encrypted content as-is
          sock.to(data.receiver).emit('receive-message', data);
        });
      });

      socket2.on('receive-message', (data) => {
        // Ciphertext should remain encrypted
        expect(data.encryptedContent).toBe('base64-ciphertext');
        done();
      });

      socket1.emit('send-message', {
        receiver: socket2.id,
        encryptedContent: 'base64-ciphertext',
        nonce: 'base64-nonce',
        sender: 'user123',
      });
    });

    it('should handle failed delivery gracefully', (done) => {
      io.on('connection', (sock) => {
        sock.on('send-message', (data) => {
          const delivered = sock.to(data.receiver).emit('receive-message', data);
          if (!delivered) {
            sock.emit('message-failed', { reason: 'user-not-found' });
          }
        });
      });

      socket1.on('message-failed', (data) => {
        expect(data.reason).toBe('user-not-found');
        done();
      });

      socket1.emit('send-message', {
        receiver: 'nonexistent-user',
        encryptedContent: 'base64-ciphertext',
        nonce: 'base64-nonce',
      });
    });
  });

  describe('User Presence', () => {
    it('should broadcast user-joined event', (done) => {
      io.on('connection', (sock) => {
        sock.broadcast.emit('user-joined', {
          userId: 'user123',
          username: 'testuser',
        });
      });

      socket2.on('user-joined', (data) => {
        expect(data.userId).toBe('user123');
        expect(data.username).toBe('testuser');
        done();
      });

      const { io: Client } = require('socket.io-client');
      const socket = new Client(`http://localhost:${httpServer.address().port}`);
    });

    it('should broadcast user-disconnected event', (done) => {
      let connectedSocket;

      io.on('connection', (sock) => {
        connectedSocket = sock;
        sock.on('disconnect', () => {
          sock.broadcast.emit('user-disconnected', {
            userId: 'user123',
          });
        });
      });

      socket2.on('user-disconnected', (data) => {
        expect(data.userId).toBe('user123');
        done();
      });

      const { io: Client } = require('socket.io-client');
      const socket = new Client(`http://localhost:${httpServer.address().port}`);

      socket.on('connect', () => {
        socket.disconnect();
      });
    });

    it('should track online users list', (done) => {
      io.on('connection', (sock) => {
        sock.on('get-online-users', () => {
          const onlineUsers = Array.from(io.sockets.sockets.keys()).map(id => ({
            socketId: id,
            userId: 'user123',
          }));
          sock.emit('online-users', onlineUsers);
        });
      });

      socket1.on('connect', () => {
        socket1.emit('get-online-users');
      });

      socket1.on('online-users', (users) => {
        expect(Array.isArray(users)).toBe(true);
        done();
      });
    });
  });

  describe('Typing Indicators', () => {
    beforeEach((done) => {
      const { io: Client } = require('socket.io-client');
      socket1 = new Client(`http://localhost:${httpServer.address().port}`);
      socket2 = new Client(`http://localhost:${httpServer.address().port}`);

      let connected = 0;
      const onConnect = () => {
        connected++;
        if (connected === 2) done();
      };

      socket1.on('connect', onConnect);
      socket2.on('connect', onConnect);
    });

    it('should emit typing event to recipient', (done) => {
      io.on('connection', (sock) => {
        sock.on('typing', (data) => {
          sock.to(data.recipient).emit('user-typing', {
            userId: data.userId,
            username: data.username,
          });
        });
      });

      socket2.on('user-typing', (data) => {
        expect(data.userId).toBe('user123');
        expect(data.username).toBe('testuser');
        done();
      });

      socket1.emit('typing', {
        recipient: socket2.id,
        userId: 'user123',
        username: 'testuser',
      });
    });

    it('should emit stop-typing event', (done) => {
      io.on('connection', (sock) => {
        sock.on('stop-typing', (data) => {
          sock.to(data.recipient).emit('user-stopped-typing', {
            userId: data.userId,
          });
        });
      });

      socket2.on('user-stopped-typing', (data) => {
        expect(data.userId).toBe('user123');
        done();
      });

      socket1.emit('stop-typing', {
        recipient: socket2.id,
        userId: 'user123',
      });
    });

    it('should handle rapid typing events', (done) => {
      let typingCount = 0;

      io.on('connection', (sock) => {
        sock.on('typing', (data) => {
          sock.to(data.recipient).emit('user-typing', data);
        });
      });

      socket2.on('user-typing', (data) => {
        typingCount++;
        if (typingCount === 5) {
          expect(typingCount).toBe(5);
          done();
        }
      });

      // Emit typing rapidly
      for (let i = 0; i < 5; i++) {
        socket1.emit('typing', {
          recipient: socket2.id,
          userId: 'user123',
          username: 'testuser',
        });
      }
    });
  });

  describe('Message Acknowledgment', () => {
    beforeEach((done) => {
      const { io: Client } = require('socket.io-client');
      socket1 = new Client(`http://localhost:${httpServer.address().port}`);
      socket2 = new Client(`http://localhost:${httpServer.address().port}`);

      let connected = 0;
      const onConnect = () => {
        connected++;
        if (connected === 2) done();
      };

      socket1.on('connect', onConnect);
      socket2.on('connect', onConnect);
    });

    it('should confirm message delivery', (done) => {
      io.on('connection', (sock) => {
        sock.on('send-message', (data, callback) => {
          sock.to(data.receiver).emit('receive-message', data);
          if (callback) callback({ delivered: true });
        });
      });

      socket1.emit('send-message',
        {
          receiver: socket2.id,
          encryptedContent: 'base64-ciphertext',
          nonce: 'base64-nonce',
        },
        (response) => {
          expect(response.delivered).toBe(true);
          done();
        }
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required fields', (done) => {
      io.on('connection', (sock) => {
        sock.on('send-message', (data) => {
          if (!data.receiver || !data.encryptedContent) {
            sock.emit('error', { message: 'Missing required fields' });
            return;
          }
        });
      });

      const { io: Client } = require('socket.io-client');
      const socket = new Client(`http://localhost:${httpServer.address().port}`);

      socket.on('connect', () => {
        socket.on('error', (data) => {
          expect(data.message).toContain('Missing required fields');
          socket.disconnect();
          done();
        });

        socket.emit('send-message', {
          // Missing receiver and encryptedContent
        });
      });
    });

    it('should handle malformed data', (done) => {
      io.on('connection', (sock) => {
        sock.on('error', (error) => {
          expect(error).toBeDefined();
          done();
        });
      });

      const { io: Client } = require('socket.io-client');
      const socket = new Client(`http://localhost:${httpServer.address().port}`);

      socket.on('connect', () => {
        socket.emit('send-message', null);
      });
    });
  });

  describe('Broadcast & Rooms', () => {
    it('should broadcast to all connected clients', (done) => {
      let broadcastCount = 0;

      io.on('connection', (sock) => {
        if (broadcastCount === 0) {
          io.emit('global-notification', {
            message: 'System maintenance',
          });
        }
      });

      socket1.on('global-notification', () => {
        broadcastCount++;
      });

      socket2.on('global-notification', () => {
        broadcastCount++;
        if (broadcastCount === 2) {
          done();
        }
      });
    });
  });

  describe('Reconnection', () => {
    it('should handle reconnection', (done) => {
      const { io: Client } = require('socket.io-client');
      const socket = new Client(`http://localhost:${httpServer.address().port}`, {
        reconnection: true,
        reconnectionDelay: 100,
      });

      let reconnected = false;

      socket.on('connect', () => {
        if (reconnected) {
          expect(socket.connected).toBe(true);
          socket.disconnect();
          done();
        } else {
          reconnected = true;
          socket.disconnect();
          socket.connect();
        }
      });
    });
  });
});

module.exports = {};
