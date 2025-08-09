const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  socket.on('join-room', ({ roomId, username }) => {
    socket.join(roomId);
    socket.username = username;
    socket.roomId = roomId;

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    
    const room = rooms.get(roomId);
    room.add({
      id: socket.id,
      username: username
    });

    socket.to(roomId).emit('user-joined', {
      userId: socket.id,
      username: username
    });

    const users = Array.from(room).map(user => ({
      id: user.id,
      username: user.username
    }));
    
    socket.emit('room-users', users);
  });

  socket.on('offer', ({ offer, targetId }) => {
    socket.to(targetId).emit('offer', {
      offer,
      senderId: socket.id,
      username: socket.username
    });
  });

  socket.on('answer', ({ answer, targetId }) => {
    socket.to(targetId).emit('answer', {
      answer,
      senderId: socket.id
    });
  });

  socket.on('ice-candidate', ({ candidate, targetId }) => {
    socket.to(targetId).emit('ice-candidate', {
      candidate,
      senderId: socket.id
    });
  });

  socket.on('mute-audio', ({ isMuted }) => {
    socket.to(socket.roomId).emit('user-muted', {
      userId: socket.id,
      isMuted
    });
  });

  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);
    
    if (socket.roomId && rooms.has(socket.roomId)) {
      const room = rooms.get(socket.roomId);
      const user = Array.from(room).find(u => u.id === socket.id);
      
      if (user) {
        room.delete(user);
        socket.to(socket.roomId).emit('user-left', {
          userId: socket.id,
          username: user.username
        });
      }
      
      if (room.size === 0) {
        rooms.delete(socket.roomId);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});