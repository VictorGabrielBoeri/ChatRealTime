const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 50 * 1024 * 1024 // 50 MB para permitir arquivos grandes
});

app.use(cors());
app.use(express.json());

// Criar diretórios para armazenar arquivos e imagens se não existirem
const uploadsDir = path.join(__dirname, 'uploads');
const filesDir = path.join(uploadsDir, 'files');
const imagesDir = path.join(uploadsDir, 'images');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

if (!fs.existsSync(filesDir)) {
  fs.mkdirSync(filesDir);
}

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

// Servir arquivos estáticos
app.use('/uploads', express.static(uploadsDir));

const users = new Map();
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.id);

  socket.on('join', ({ username, room }) => {
    socket.join(room);
    
    users.set(socket.id, { username, room });
    
    if (!rooms.has(room)) {
      rooms.set(room, new Set());
    }
    rooms.get(room).add({ id: socket.id, username });
    
    // Notificar outros usuários
    socket.to(room).emit('userJoined', username);
    
    // Enviar lista de usuários atualizada
    const roomUsers = Array.from(rooms.get(room));
    io.to(room).emit('users', roomUsers.map(user => ({
      id: user.id,
      username: user.username,
      isOnline: true
    })));
  });

  socket.on('message', (message) => {
    const user = users.get(socket.id);
    if (user) {
      io.to(user.room).emit('message', {
        ...message,
        timestamp: new Date()
      });
    }
  });

  // Receber e processar arquivos
  socket.on('file', ({ message, file }) => {
    const user = users.get(socket.id);
    if (user) {
      const fileName = `${Date.now()}-${message.fileName}`;
      const filePath = path.join(filesDir, fileName);
      
      // Salvar o arquivo no servidor
      fs.writeFile(filePath, Buffer.from(file), (err) => {
        if (err) {
          console.error('Erro ao salvar arquivo:', err);
          return;
        }
        
        // Criar URL para o arquivo
        const fileUrl = `/uploads/files/${fileName}`;
        
        // Enviar mensagem com o arquivo para todos os usuários na sala
        io.to(user.room).emit('file', {
          ...message,
          fileUrl,
          timestamp: new Date()
        });
      });
    }
  });

  // Receber e processar imagens
  socket.on('image', ({ message, image }) => {
    const user = users.get(socket.id);
    if (user) {
      const fileName = `${Date.now()}-${message.fileName}`;
      const filePath = path.join(imagesDir, fileName);
      
      // Salvar a imagem no servidor
      fs.writeFile(filePath, Buffer.from(image), (err) => {
        if (err) {
          console.error('Erro ao salvar imagem:', err);
          return;
        }
        
        // Criar URL para a imagem
        const imageUrl = `/uploads/images/${fileName}`;
        
        // Enviar mensagem com a imagem para todos os usuários na sala
        io.to(user.room).emit('image', {
          ...message,
          imageUrl,
          timestamp: new Date()
        });
      });
    }
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      const { username, room } = user;
      
      // Remover usuário da sala
      if (rooms.has(room)) {
        const roomUsers = rooms.get(room);
        roomUsers.forEach(u => {
          if (u.id === socket.id) {
            roomUsers.delete(u);
          }
        });
        
        // Notificar outros usuários
        socket.to(room).emit('userLeft', username);
        
        // Enviar lista atualizada
        const updatedUsers = Array.from(roomUsers);
        io.to(room).emit('users', updatedUsers.map(user => ({
          id: user.id,
          username: user.username,
          isOnline: true
        })));
      }
      
      users.delete(socket.id);
    }
    
    console.log('Usuário desconectado:', socket.id);
  });
});

// Altere esta linha se necessário para evitar conflitos de porta
const PORT = process.env.PORT || 3001; // Mudando de 3000 para 3001
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});