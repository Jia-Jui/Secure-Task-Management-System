import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="min-h-screen grid lg:grid-cols-2">
    <!-- Left: color hero (no logo) -->
    <section class="hidden lg:flex items-center justify-center bg-gradient-to-br from-indigo-600 to-fuchsia-600 p-12">
      <div class="max-w-md text-white space-y-5">
        <h1 class="text-4xl font-bold leading-tight">Task Management</h1>
        <p class="text-white/90">Secure, RBAC-aware tasks for your team.</p>
      </div>
    </section>

    <!-- Right: auth card -->
    <section class="flex items-center justify-center p-8 bg-gray-50 dark:bg-neutral-950">
      <div class="w-full max-w-sm rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm p-6 space-y-5">
        <div>
          <h2 class="text-xl font-semibold">Welcome back</h2>
          <p class="text-xs opacity-60">Sign in to continue</p>
        </div>

        <form (ngSubmit)="onLogin()" class="space-y-3">
          <label class="block">
            <span class="text-sm">Email</span>
            <input [(ngModel)]="email" name="email" required type="email"
              class="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-800 px-3 py-2" />
          </label>

          <label class="block">
            <span class="text-sm">Password</span>
            <input [(ngModel)]="password" name="password" required type="password"
              class="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-800 px-3 py-2" />
          </label>

          <button [disabled]="loading"
            class="w-full rounded-xl bg-indigo-600 text-white px-4 py-2">
            {{ loading ? 'Signing in…' : 'Login' }}
          </button>
        </form>

        <p class="text-xs opacity-60">Demo: owner@acme.io / owner · admin@acme.io / admin · viewer@acme.io / viewer</p>
      </div>
    </section>
  </div>
  `
})
export class LoginComponent {
  email=''; password=''; loading=false;
  constructor(private auth: AuthService, private router: Router) {}
  onLogin() {
    if (this.loading) return;
    this.loading = true;
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => { localStorage.setItem('jwt', res.accessToken); this.router.navigateByUrl('/tasks'); },
      error: () => { alert('Login failed'); this.loading = false; }
    });
  }
}
