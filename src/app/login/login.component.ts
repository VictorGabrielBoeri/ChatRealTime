import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  hidePassword: boolean = true;
  errorMessage: string = '';

  constructor(private router: Router, private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // Verificar se já existe um usuário salvo no localStorage
    const savedUser = localStorage.getItem('chatUsername');
    if (savedUser) {
      this.loginForm.patchValue({
        email: savedUser,
        rememberMe: true
      });
    }
    
    // Verificar se o usuário já está logado
    if (localStorage.getItem('currentUser')) {
      this.router.navigate(['/chat']);
    }
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    const { email, password, rememberMe } = this.loginForm.value;
    
    // Verificar se o usuário existe no localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u: any) => u.email === email);
    
    if (!user) {
      this.errorMessage = 'Usuário não encontrado. Por favor, registre-se.';
      return;
    }
    
    if (user.password !== password) {
      this.errorMessage = 'Senha incorreta. Por favor, tente novamente.';
      return;
    }

    // Extrair o nome de usuário do email (parte antes do @)
    const username = email.split('@')[0];
    
    // Salvar no localStorage se rememberMe estiver marcado
    if (rememberMe) {
      localStorage.setItem('chatUsername', email);
    } else {
      localStorage.removeItem('chatUsername');
    }

    // Salvar o nome de usuário para uso no chat
    localStorage.setItem('currentUser', username);
    
    // Navegar para a página de chat
    this.router.navigate(['/chat']);
  }

  loginWithGoogle(): void {
    // Simulação de login com Google
    const username = 'Google_User_' + Math.floor(Math.random() * 1000);
    const email = username + '@gmail.com';
    
    // Registrar usuário se não existir
    this.registerSocialUser(username, email);
    
    localStorage.setItem('currentUser', username);
    this.router.navigate(['/chat']);
  }

  loginWithFacebook(): void {
    // Simulação de login com Facebook
    const username = 'Facebook_User_' + Math.floor(Math.random() * 1000);
    const email = username + '@facebook.com';
    
    // Registrar usuário se não existir
    this.registerSocialUser(username, email);
    
    localStorage.setItem('currentUser', username);
    this.router.navigate(['/chat']);
  }

  registerSocialUser(username: string, email: string): void {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (!users.find((u: any) => u.email === email)) {
      users.push({
        email,
        username,
        password: 'social-login-' + Math.random().toString(36).substring(2),
        createdAt: new Date()
      });
      localStorage.setItem('users', JSON.stringify(users));
    }
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  // Função auxiliar para marcar todos os campos como tocados
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }
}