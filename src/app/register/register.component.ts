import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  hidePassword: boolean = true;
  hideConfirmPassword: boolean = true;
  errorMessage: string = '';

  constructor(private router: Router, private fb: FormBuilder) {
    // Inicializar o formulário no construtor para evitar problemas
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      termsAccepted: [false, Validators.requiredTrue]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Verificar se o usuário já está logado
    if (localStorage.getItem('currentUser')) {
      this.router.navigate(['/chat']);
    }
  }

  // Validador personalizado para verificar se as senhas coincidem
  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { 'mismatch': true };
  }

  register(): void {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    const { email, password } = this.registerForm.value;
    
    // Verificar se o usuário já existe
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.some((user: any) => user.email === email)) {
      this.errorMessage = 'Este email já está registrado. Por favor, faça login.';
      return;
    }
    
    // Extrair o nome de usuário do email (parte antes do @)
    const username = email.split('@')[0];
    
    // Adicionar novo usuário
    users.push({
      email,
      username,
      password,
      createdAt: new Date()
    });
    
    localStorage.setItem('users', JSON.stringify(users));
    
    // Salvar o nome de usuário para uso no chat
    localStorage.setItem('currentUser', username);
    
    // Navegar para a página de chat
    this.router.navigate(['/chat']);
  }

  togglePasswordVisibility(): void {
    console.log('Toggle password visibility');
    this.hidePassword = !this.hidePassword;
  }

  toggleConfirmPasswordVisibility(): void {
    console.log('Toggle confirm password visibility');
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }

  goToLogin(): void {
    this.router.navigate(['/']);
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
