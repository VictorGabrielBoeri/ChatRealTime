import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

export interface Message {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  room: string;
  fileUrl?: string;
  imageUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

export interface User {
  id: string;
  username: string;
  isOnline: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private url = 'http://localhost:3001'; // Atualize para a mesma porta

  constructor() {
    this.socket = io(this.url);
    
    // Adicionar logs para depuração
    this.socket.on('connect', () => {
      console.log('Conectado ao servidor Socket.io');
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Erro de conexão Socket.io:', error);
    });
  }

  // Conectar usuário
  joinRoom(username: string, room: string): void {
    this.socket.emit('join', { username, room });
    console.log(`Tentando entrar na sala ${room} como ${username}`);
  }

  // Enviar mensagem
  sendMessage(message: Message): void {
    console.log('Enviando mensagem:', message);
    this.socket.emit('message', message);
  }

  // Escutar mensagens
  getMessages(): Observable<Message> {
    return new Observable(observer => {
      this.socket.on('message', (data: Message) => {
        console.log('Mensagem recebida:', data);
        observer.next(data);
      });
    });
  }

  // Escutar usuários online
  getUsers(): Observable<User[]> {
    return new Observable(observer => {
      this.socket.on('users', (data: User[]) => {
        observer.next(data);
      });
    });
  }

  // Notificações de usuário entrando/saindo
  getUserNotifications(): Observable<string> {
    return new Observable(observer => {
      this.socket.on('userJoined', (data: string) => {
        observer.next(`${data} entrou no chat`);
      });
      this.socket.on('userLeft', (data: string) => {
        observer.next(`${data} saiu do chat`);
      });
    });
  }

  // Desconectar
  disconnect(): void {
    this.socket.disconnect();
  }

  // Enviar arquivo
  sendFile(message: Message, file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const fileData = reader.result;
      this.socket.emit('file', { message, file: fileData });
    };
    reader.readAsArrayBuffer(file);
  }

  // Enviar imagem
  sendImage(message: Message, image: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result;
      this.socket.emit('image', { message, image: imageData });
    };
    reader.readAsArrayBuffer(image);
  }

  // Escutar arquivos e imagens recebidos
  getFiles(): Observable<Message> {
    return new Observable(observer => {
      this.socket.on('file', (data: Message) => {
        observer.next(data);
      });
    });
  }

  getImages(): Observable<Message> {
    return new Observable(observer => {
      this.socket.on('image', (data: Message) => {
        observer.next(data);
      });
    });
  }
}