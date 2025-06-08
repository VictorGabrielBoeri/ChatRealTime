import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SocketService, Message, User } from '../../services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  messageForm: FormGroup;
  loginForm: FormGroup;
  messages: Message[] = [];
  users: User[] = [];
  currentUser: string = '';
  currentRoom: string = 'geral';
  isLoggedIn: boolean = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private socketService: SocketService
  ) {
    this.messageForm = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(1)]]
    });
    
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(2)]],
      room: ['geral', Validators.required]
    });
  }

  ngOnInit(): void {
    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.socketService.disconnect();
  }

  private setupSocketListeners(): void {
    // Escutar mensagens
    const messagesSub = this.socketService.getMessages().subscribe(message => {
      this.messages.push(message);
      this.scrollToBottom();
    });

    // Escutar usuários online
    const usersSub = this.socketService.getUsers().subscribe(users => {
      this.users = users;
    });

    // Escutar notificações
    const notificationsSub = this.socketService.getUserNotifications().subscribe(notification => {
      this.addSystemMessage(notification);
    });

    this.subscriptions.push(messagesSub, usersSub, notificationsSub);
  }

  login(): void {
    if (this.loginForm.valid) {
      const { username, room } = this.loginForm.value;
      this.currentUser = username;
      this.currentRoom = room;
      this.socketService.joinRoom(username, room);
      this.isLoggedIn = true;
    }
  }

  sendMessage(): void {
    if (this.messageForm.valid && this.messageForm.value.message.trim()) {
      const message: Message = {
        id: this.generateId(),
        username: this.currentUser,
        message: this.messageForm.value.message.trim(),
        timestamp: new Date(),
        room: this.currentRoom
      };
      
      this.socketService.sendMessage(message);
      this.messageForm.reset();
    }
  }

  private addSystemMessage(text: string): void {
    const systemMessage: Message = {
      id: this.generateId(),
      username: 'Sistema',
      message: text,
      timestamp: new Date(),
      room: this.currentRoom
    };
    this.messages.push(systemMessage);
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = 
          this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  logout(): void {
    this.isLoggedIn = false;
    this.messages = [];
    this.users = [];
    this.socketService.disconnect();
  }
}