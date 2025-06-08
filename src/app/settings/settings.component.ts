import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  // Configurações do usuário
  username: string = '';
  isDarkTheme: boolean = true;
  enableNotifications: boolean = true;
  messageSound: boolean = true;
  fontSize: number = 14;
  language: string = 'pt-BR';

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Carregar configurações salvas
    this.loadSettings();
  }

  loadSettings(): void {
    // Carregar nome de usuário
    const savedUsername = localStorage.getItem('chatUsername');
    if (savedUsername) {
      this.username = savedUsername;
    }

    // Carregar tema
    const savedTheme = localStorage.getItem('chatTheme');
    if (savedTheme) {
      this.isDarkTheme = savedTheme === 'dark';
    }

    // Carregar outras configurações
    const savedNotifications = localStorage.getItem('chatNotifications');
    if (savedNotifications) {
      this.enableNotifications = savedNotifications === 'true';
    }

    const savedMessageSound = localStorage.getItem('chatMessageSound');
    if (savedMessageSound) {
      this.messageSound = savedMessageSound === 'true';
    }

    const savedFontSize = localStorage.getItem('chatFontSize');
    if (savedFontSize) {
      this.fontSize = parseInt(savedFontSize);
    }

    const savedLanguage = localStorage.getItem('chatLanguage');
    if (savedLanguage) {
      this.language = savedLanguage;
    }
  }

  saveSettings(): void {
    // Salvar todas as configurações no localStorage
    localStorage.setItem('chatUsername', this.username);
    localStorage.setItem('chatTheme', this.isDarkTheme ? 'dark' : 'light');
    localStorage.setItem('chatNotifications', this.enableNotifications.toString());
    localStorage.setItem('chatMessageSound', this.messageSound.toString());
    localStorage.setItem('chatFontSize', this.fontSize.toString());
    localStorage.setItem('chatLanguage', this.language);

    // Aplicar tema
    document.body.classList.toggle('light-theme', !this.isDarkTheme);
    document.body.classList.toggle('dark-theme', this.isDarkTheme);

    // Mostrar mensagem de sucesso
    alert('Configurações salvas com sucesso!');
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    // Não salvamos aqui, apenas quando o usuário clicar em Salvar
  }

  backToChat(): void {
    this.router.navigate(['/']);
  }
}