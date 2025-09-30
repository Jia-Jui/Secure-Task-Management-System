import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-coming-soon',
  imports: [CommonModule, RouterLink],   // ← add RouterLink
  template: `
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm grid place-items-center p-6 z-50">
    <div class="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 shadow-xl p-6">
      <h2 class="text-xl font-semibold mb-2">Coming soon</h2>
      <p class="text-sm text-slate-600 dark:text-slate-300">
        This feature is on the way. For now, try the Tasks board.
      </p>

      <div class="mt-6 flex justify-end gap-2">
        <a [routerLink]="['/tasks']"
           class="px-4 py-2 rounded-xl border border-black/10 dark:border-white/10">Go to Tasks</a>
        <button (click)="close()" class="px-4 py-2 rounded-xl bg-indigo-600 text-white">OK</button>
      </div>
    </div>
  </div>
  `,
})
export class ComingSoonComponent {
  close() {
    history.length > 1 ? history.back() : (location.href = '/tasks');
  }
}
