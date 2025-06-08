import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

export interface Message {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  room: string;
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
  private url = 'http://localhost:3000';

  constructor() {
    this.socket = io(this.url);
  }

  // Conectar usuário
  joinRoom(username: string, room: string): void {
    this.socket.emit('join', { username, room });
  }

  // Enviar mensagem
  sendMessage(message: Message): void {
    this.socket.emit('message', message);
  }

  // Escutar mensagens
  getMessages(): Observable<Message> {
    return new Observable(observer => {
      this.socket.on('message', (data: Message) => {
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
}