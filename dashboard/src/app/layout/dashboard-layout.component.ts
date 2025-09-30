import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, RouterLink],
  template: `
  <div class="min-h-screen grid xl:grid-cols-[88px_1fr]">
    <!-- Left rail (icons only, no logo) -->
    <aside class="hidden xl:flex flex-col items-center gap-4 py-6 px-3
                  backdrop-blur bg-white/70 dark:bg-neutral-900/60
                  border-r border-black/5 dark:border-white/10">
      <div class="flex flex-col gap-3 text-[22px]">
        <a routerLink="/tasks"
           class="w-12 h-12 grid place-items-center rounded-2xl
                  bg-indigo-600/15 text-indigo-400 hover:bg-indigo-600/25"
           title="Tasks">🧩</a>

        <!-- Files -> Coming soon -->
        <a routerLink="/files"
           class="w-12 h-12 grid place-items-center rounded-2xl
                  hover:bg-black/5 dark:hover:bg-white/10"
           title="Files (coming soon)">📄</a>

        <!-- Settings -> Coming soon -->
        <a routerLink="/settings"
           class="w-12 h-12 grid place-items-center rounded-2xl
                  hover:bg-black/5 dark:hover:bg-white/10"
           title="Settings (coming soon)">⚙️</a>
      </div>

      <div class="mt-auto flex flex-col gap-3">
        <button (click)="toggleDark()"
                class="w-12 h-12 grid place-items-center rounded-2xl hover:bg-black/5 dark:hover:bg-white/10"
                title="Toggle dark mode">🌓</button>
        <button (click)="logout()"
                class="w-12 h-12 grid place-items-center rounded-2xl hover:bg-black/5 dark:hover:bg-white/10"
                title="Logout">↩</button>
      </div>
    </aside>

    <!-- Main column -->
    <div class="flex min-h-screen flex-col">
      <!-- No global search bar anymore -->
      <main class="px-4 md:px-6 py-6 max-w-[1400px] w-full mx-auto">
        <router-outlet />
      </main>
    </div>
  </div>
  `
})
export class DashboardLayoutComponent {
  toggleDark() {
    const el = document.documentElement;
    el.classList.toggle('dark');
    localStorage.setItem('theme', el.classList.contains('dark') ? 'dark' : 'light');
  }
  logout() { localStorage.removeItem('jwt'); location.href = '/login'; }
}
