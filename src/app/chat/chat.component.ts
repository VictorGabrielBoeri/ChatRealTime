import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { SocketService, Message, User } from '../../services/socket.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit, OnDestroy {
  username = '';
  message = '';
  messages: Message[] = [];
  users: User[] = [];
  filteredUsers: User[] = []; // Lista de usuários filtrada (sem o usuário atual)
  selectedUser: User | null = null;
  currentRoom = 'geral';
  notifications: string[] = [];
  newMessages = 0;
  isDarkTheme = true; // Tema escuro por padrão
  showUserMenu = false; // Controlar a visibilidade do menu
  activeSection = 'mail'; // Seção ativa padrão (mensagens)
  searchTerm = '';
  allUsers: User[] = []; // Lista completa de usuários
  selectedFile: File | null = null; // Adicionar esta propriedade
  selectedImage: File | null = null; // Adicionar esta propriedade
  previewImage: string | null = null; // Adicionar esta propriedade para visualização de imagens
  
  // Adicionar as propriedades que faltam
  favorites: User[] = []; // Lista de usuários favoritos
  sharedFiles: Message[] = []; // Lista de arquivos compartilhados
  showNewConversationModal = false; // Controlar a exibição do modal de nova conversa
  newContactEmail = ''; // Email para nova conversa

  constructor(
    private socketService: SocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Carregar preferência de tema do localStorage
    const savedTheme = localStorage.getItem('chatTheme');
    if (savedTheme) {
      this.isDarkTheme = savedTheme === 'dark';
      this.applyTheme();
    }
    
    // Carregar seção ativa do localStorage
    const savedSection = localStorage.getItem('activeSection');
    if (savedSection) {
      this.activeSection = savedSection;
    }
    
    // Obter nome de usuário do localStorage (definido na página de login)
    this.username = localStorage.getItem('currentUser') || '';
    
    // Se não houver nome de usuário, redirecionar para a página de login
    if (!this.username) {
      this.router.navigate(['/']);
      return;
    }
    
    // Entrar na sala padrão
    this.socketService.joinRoom(this.username, this.currentRoom);
    
    // Escutar mensagens
    this.socketService.getMessages().subscribe((message: Message) => {
      this.messages.push(message);
      // Rolar para a última mensagem
      setTimeout(() => {
        const chatContainer = document.querySelector('.chat-messages');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);
    });
    
    // Escutar usuários online
    this.socketService.getUsers().subscribe((users: User[]) => {
      this.users = users;
      this.allUsers = [...users]; // Armazenar todos os usuários
      // Filtrar o usuário atual da lista
      this.filterContacts();
    });
    
    // Escutar notificações
    this.socketService.getUserNotifications().subscribe((notification: string) => {
      this.notifications.push(notification);
      this.newMessages++;
    });
    
    // Carregar favoritos do localStorage
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      this.favorites = JSON.parse(savedFavorites);
    }
    
    // Escutar arquivos e imagens para a seção de arquivos compartilhados
    this.socketService.getFiles().subscribe((message: Message) => {
      this.messages.push(message);
      if (message.fileUrl) {
        this.sharedFiles.push(message);
      }
    });
    
    this.socketService.getImages().subscribe((message: Message) => {
      this.messages.push(message);
      if (message.imageUrl) {
        this.sharedFiles.push(message);
      }
    });
  }
  
  // Método para adicionar/remover favoritos
  toggleFavorite(user: User): void {
    const index = this.favorites.findIndex(fav => fav.id === user.id);
    
    if (index === -1) {
      // Adicionar aos favoritos
      this.favorites.push(user);
    } else {
      // Remover dos favoritos
      this.favorites.splice(index, 1);
    }
    
    // Salvar no localStorage
    localStorage.setItem('favorites', JSON.stringify(this.favorites));
  }
  
  // Verificar se um usuário é favorito
  isFavorite(user: User): boolean {
    return this.favorites.some(fav => fav.id === user.id);
  }
  
  // Abrir modal de nova conversa
  openNewConversationModal(): void {
    this.showNewConversationModal = true;
  }
  
  // Fechar modal de nova conversa
  closeNewConversationModal(): void {
    this.showNewConversationModal = false;
    this.newContactEmail = '';
  }
  
  // Iniciar nova conversa com email
  startNewConversation(): void {
    if (!this.newContactEmail.trim()) return;
    
    // Verificar se o usuário já existe na lista
    const existingUser = this.allUsers.find(user => 
      user.username.toLowerCase() === this.newContactEmail.toLowerCase());
    
    if (existingUser) {
      this.selectUser(existingUser);
      this.activateSection('mail');
    } else {
      // Criar um usuário temporário para iniciar conversa
      const newUser: User = {
        id: `temp_${Date.now()}`,
        username: this.newContactEmail,
        isOnline: false
      };
      
      this.allUsers.push(newUser);
      this.filterContacts();
      this.selectUser(newUser);
      this.activateSection('mail');
    }
    
    this.closeNewConversationModal();
  }
  
  // Método para lidar com a seleção de arquivos
  handleFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.message = `Arquivo: ${this.selectedFile.name}`;
    }
  }

  // Método para lidar com a seleção de imagens
  handleImageInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedImage = input.files[0];
      this.message = '';
    }
  }

  // Método para enviar arquivo
  sendFile(): void {
    if (!this.selectedFile) return;
    
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const fileData = e.target?.result;
      if (fileData) {
        const fileMessage: Message = {
          id: Date.now().toString(),
          username: this.username,
          message: this.message,
          timestamp: new Date(),
          room: this.currentRoom,
          fileUrl: URL.createObjectURL(this.selectedFile!),
          fileName: this.selectedFile!.name,
          fileType: this.selectedFile!.type,
          fileSize: this.selectedFile!.size
        };
        
        this.socketService.sendFile(fileMessage, this.selectedFile!);
        this.message = '';
        this.selectedFile = null;
        
        // Resetar o input de arquivo
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    };
    reader.readAsArrayBuffer(this.selectedFile);
  }

  // Método para enviar imagem
  sendImage(): void {
    if (!this.selectedImage) return;
    
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const imageData = e.target?.result;
      if (imageData) {
        const imageMessage: Message = {
          id: Date.now().toString(),
          username: this.username,
          message: this.message,
          timestamp: new Date(),
          room: this.currentRoom,
          imageUrl: URL.createObjectURL(this.selectedImage!),
          fileName: this.selectedImage!.name,
          fileType: this.selectedImage!.type,
          fileSize: this.selectedImage!.size
        };
        
        this.socketService.sendImage(imageMessage, this.selectedImage!);
        this.message = '';
        this.selectedImage = null;
        
        // Resetar o input de imagem
        const imageInput = document.getElementById('image-upload') as HTMLInputElement;
        if (imageInput) imageInput.value = '';
      }
    };
    reader.readAsArrayBuffer(this.selectedImage);
  }

  // Métodos para visualização de imagens
  openImagePreview(imageUrl: string): void {
    this.previewImage = imageUrl;
  }

  closeImagePreview(): void {
    this.previewImage = null;
  }

  // Ativar seção
  public activateSection(section: string): void {
    this.activeSection = section;
    // Salvar preferência no localStorage
    localStorage.setItem('activeSection', section);
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    this.applyTheme();
    // Salvar preferência no localStorage
    localStorage.setItem('chatTheme', this.isDarkTheme ? 'dark' : 'light');
  }

  applyTheme(): void {
    document.body.classList.toggle('light-theme', !this.isDarkTheme);
    document.body.classList.toggle('dark-theme', this.isDarkTheme);
  }

  // Método para enviar mensagem (modificado para suportar arquivos e imagens)
  sendMessage(): void {
    console.log('Tentando enviar mensagem:', this.message);
    console.log('Arquivo selecionado:', this.selectedFile);
    console.log('Imagem selecionada:', this.selectedImage);
    
    if (this.message.trim() === '' && !this.selectedFile && !this.selectedImage) {
      console.log('Nada para enviar');
      return;
    }
    
    if (this.selectedFile) {
      console.log('Enviando arquivo');
      this.sendFile();
      return;
    }
    
    if (this.selectedImage) {
      console.log('Enviando imagem');
      this.sendImage();
      return;
    }
    
    const newMessage: Message = {
      id: Date.now().toString(),
      username: this.username,
      message: this.message,
      timestamp: new Date(),
      room: this.currentRoom
    };
    
    console.log('Enviando mensagem de texto:', newMessage);
    this.socketService.sendMessage(newMessage);
    this.message = '';
  }

  selectUser(user: User): void {
    this.selectedUser = user;
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.socketService.disconnect();
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    this.socketService.disconnect();
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  // Fechar o menu quando clicar fora dele
  @HostListener('document:click', ['$event'])
  closeMenu(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-dropdown')) {
      this.showUserMenu = false;
    }
  }

  // Método para filtrar contatos
  filterContacts(): void {
    if (!this.searchTerm) {
      // Se não houver termo de busca, mostrar todos os usuários exceto o atual
      this.filteredUsers = this.allUsers.filter(user => user.username !== this.username);
    } else {
      // Filtrar usuários pelo termo de busca
      this.filteredUsers = this.allUsers.filter(user => 
        user.username !== this.username && 
        user.username.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  // Método para limpar a busca
  clearSearch(): void {
    this.searchTerm = '';
    this.filterContacts();
  }
}
