import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TasksApi } from './tasks.service';

type Status = 'todo' | 'in_progress' | 'done';

type Task = {
  id: number;
  title: string;
  description?: string;
  status: Status;
  creatorEmail?: string;
  position?: number;
};

@Component({
  standalone: true,
  selector: 'app-tasks',
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
  <!-- 403 Popup -->
  <div *ngIf="popupMsg" class="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm grid place-items-center p-6">
    <div class="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 shadow-xl p-6">
      <h2 class="text-lg font-semibold mb-2">Action not allowed</h2>
      <p class="text-sm text-slate-600 dark:text-slate-300">{{ popupMsg }}</p>
      <div class="mt-6 flex justify-end">
        <button (click)="closePopup()" class="px-4 py-2 rounded-xl bg-indigo-600 text-white">OK</button>
      </div>
    </div>
  </div>

  <!-- Page title + Org switcher -->
  <section class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Task</h1>

    <!-- Org switcher (compact) -->
    <form (ngSubmit)="applyOrg($event)" class="flex items-center gap-2">
      <label class="text-sm opacity-70">Org ID</label>
      <input type="number" min="1"
             [(ngModel)]="orgIdInput" name="orgIdInput"
             class="w-24 h-9 px-3 rounded-lg text-sm bg-slate-100 dark:bg-white/10
                    border border-black/10 dark:border-white/10 outline-none" />
      <button type="submit"
              class="h-9 px-3 rounded-lg text-sm font-medium text-white bg-indigo-600">Switch</button>
    </form>
  </section>

  <!-- Quick filters: status pills + search -->
  <section class="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div class="flex gap-2">
      <button class="px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10"
              [class.bg-indigo-600]="statusFilter==='all'"
              [class.text-white]="statusFilter==='all'"
              (click)="setStatusFilter('all')">All</button>
      <button class="px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10"
              [class.bg-indigo-600]="statusFilter==='todo'"
              [class.text-white]="statusFilter==='todo'"
              (click)="setStatusFilter('todo')">To Do</button>
      <button class="px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10"
              [class.bg-indigo-600]="statusFilter==='in_progress'"
              [class.text-white]="statusFilter==='in_progress'"
              (click)="setStatusFilter('in_progress')">In Progress</button>
      <button class="px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10"
              [class.bg-indigo-600]="statusFilter==='done'"
              [class.text-white]="statusFilter==='done'"
              (click)="setStatusFilter('done')">Done</button>
    </div>

    <div class="w-full md:w-auto">
      <input [(ngModel)]="filter" (ngModelChange)="rebuild()"
             placeholder="Filter tasks by title/description…"
             class="w-full md:w-72 px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/10
                    border border-black/10 dark:border-white/10 outline-none" />
    </div>
  </section>

  <!-- Metrics -->
  <section class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
    <div class="rounded-2xl border border-black/5 dark:border-white/10 shadow-sm p-4 bg-white dark:bg-neutral-900">
      <div class="text-xs text-slate-500 dark:text-slate-400">Task Completed (Org {{orgId}})</div>
      <div class="text-2xl font-semibold">{{ counts.done }}</div>
    </div>
    <div class="rounded-2xl border border-black/5 dark:border-white/10 shadow-sm p-4 bg-white dark:bg-neutral-900">
      <div class="text-xs text-slate-500 dark:text-slate-400">To Do</div>
      <div class="text-2xl font-semibold">{{ counts.todo }}</div>
    </div>
    <div class="rounded-2xl border border-black/5 dark:border-white/10 shadow-sm p-4 bg-white dark:bg-neutral-900">
      <div class="text-xs text-slate-500 dark:text-slate-400">In Progress</div>
      <div class="text-2xl font-semibold">{{ counts.in_progress }}</div>
    </div>
  </section>

  <!-- Composer (title + description) -->
  <section class="rounded-2xl border border-black/5 dark:border-white/10 shadow-sm p-4 mb-6 bg-white dark:bg-neutral-900">
    <form (ngSubmit)="onSubmit($event)" novalidate
          class="grid gap-2 md:grid-cols-[minmax(0,520px)_260px] md:items-stretch">
      <div class="grid gap-2">
        <input [(ngModel)]="title" name="title" required
               placeholder="Task title…"
               class="text-sm h-10 px-3 rounded-xl bg-slate-100 dark:bg-white/10
                      border border-black/10 dark:border-white/10 outline-none" />
        <textarea [(ngModel)]="desc" name="desc" rows="2"
                  placeholder="Optional description…"
                  class="text-sm leading-5 min-h-[2.5rem] max-h-24 h-10 px-3 py-2 rounded-xl
                         bg-slate-100 dark:bg-white/10 border border-black/10 dark:border-white/10
                         outline-none resize-y"></textarea>
      </div>

      <button type="submit"
              class="h-10 w-24 rounded-xl text-sm font-medium text-white bg-indigo-600 shrink-0">
        Add
      </button>
    </form>
  </section>

  <!-- 3-column board -->
  <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div *ngFor="let col of columns" class="rounded-2xl border border-black/5 dark:border-white/10 shadow-sm bg-white dark:bg-neutral-900 flex flex-col">
      <div class="px-4 py-3 flex items-center justify-between border-b border-black/5 dark:border-white/10">
        <div class="font-semibold">{{ col.label }}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400">{{ (lists[col.key] || []).length }}</div>
      </div>

      <div cdkDropList [cdkDropListData]="lists[col.key]" (cdkDropListDropped)="dropped($event, col.key)"
           class="p-3 flex-1 min-h-[300px] space-y-3">
        <article *ngFor="let t of lists[col.key]" cdkDrag
                 class="rounded-xl p-3 border border-black/5 dark:border-white/10
                        bg-gradient-to-br from-white to-slate-50 dark:from-neutral-900 dark:to-neutral-800">
          <ng-container *ngIf="editingId !== t.id; else editTpl">
            <header class="text-sm font-medium select-none" (dblclick)="startEdit(t)">{{ t.title }}</header>
            <p *ngIf="t.description" class="mt-1 text-xs text-slate-600 dark:text-slate-300">{{ t.description }}</p>
          </ng-container>

          <ng-template #editTpl>
            <form (ngSubmit)="saveEdit(t)" class="flex flex-col gap-2">
              <input [(ngModel)]="editTitle" name="editTitle" (keydown.escape)="cancelEdit()"
                     class="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-white/10 border border-black/10 dark:border-white/10"
                     placeholder="Title" autofocus />
              <textarea [(ngModel)]="editDesc" name="editDesc" rows="3"
                        class="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-white/10 border border-black/10 dark:border-white/10"
                        placeholder="Description (optional)"></textarea>
              <div class="flex gap-2">
                <button type="submit" class="text-xs px-3 py-1.5 rounded bg-indigo-600 text-white">Save</button>
                <button type="button" (click)="cancelEdit()" class="text-xs px-3 py-1.5 rounded border border-black/10 dark:border-white/10">Cancel</button>
              </div>
            </form>
          </ng-template>

          <div *ngIf="t.creatorEmail" class="text-xs text-slate-500 dark:text-slate-400 mt-1">by {{ t.creatorEmail }}</div>

          <footer class="mt-3 flex flex-wrap gap-3">
            <button class="text-slate-500 dark:text-slate-400 text-xs" (click)="mark(t,'todo')">To&nbsp;Do</button>
            <button class="text-blue-500 dark:text-blue-400 text-xs"  (click)="mark(t,'in_progress')">In&nbsp;Progress</button>
            <button class="text-emerald-500 dark:text-emerald-400 text-xs" (click)="mark(t,'done')">Done</button>
            <span class="mx-1 opacity-30">|</span>
            <button class="text-slate-500 dark:text-slate-400 text-xs" (click)="startEdit(t)">✏️ Edit</button>
            <button class="text-rose-500 dark:text-rose-400 text-xs"   (click)="del(t)">Delete</button>
          </footer>
        </article>
      </div>
    </div>
  </section>
  `
})
export class TasksComponent implements OnInit {
  // org selection
  orgId = 1;
  orgIdInput = 1;
  lastGoodOrgId = 1;            // <— tracks last accessible org

  title = '';
  desc = '';
  tasks: Task[] = [];

  // inline edit state
  editingId: number | null = null;
  editTitle = '';
  editDesc = '';

  // quick filters
  filter = '';
  statusFilter: 'all' | Status = 'all';

  // popup state
  popupMsg: string | null = null;

  columns = [
    { key: 'todo' as const,        label: 'To Do' },
    { key: 'in_progress' as const, label: 'In Progress' },
    { key: 'done' as const,        label: 'Done' },
  ];

  lists: Record<Status, Task[]> = { todo: [], in_progress: [], done: [] };

  constructor(private api: TasksApi) {}

  ngOnInit() {
    const saved = Number(localStorage.getItem('orgId'));
    if (Number.isFinite(saved) && saved > 0) {
      this.orgId = saved;
      this.orgIdInput = saved;
      this.lastGoodOrgId = saved;
    } else {
      this.persistOrg();
    }
    this.refresh();
  }

  private persistOrg() {
    localStorage.setItem('orgId', String(this.orgId));
  }

  applyOrg(ev: Event) {
    ev.preventDefault();
    const n = Number(this.orgIdInput);
    if (!Number.isFinite(n) || n < 1) return;
    if (n === this.orgId) return;
    this.orgId = n;
    this.persistOrg();
    this.refresh(); // will popup + rollback if 403
  }

  get counts() {
    return {
      done: this.tasks.filter(t => t.status === 'done').length,
      todo: this.tasks.filter(t => t.status === 'todo').length,
      in_progress: this.tasks.filter(t => t.status === 'in_progress').length,
    };
  }

  setStatusFilter(f: 'all' | Status) {
    this.statusFilter = f;
    this.rebuild();
  }

  private matchesFilter(t: Task) {
    const q = (this.filter || '').trim().toLowerCase();
    if (!q) return true;
    return (
      t.title?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.creatorEmail?.toLowerCase().includes(q)
    );
  }

  // public so template can call it
  rebuild() {
    const byPos = (a: Task, b: Task) => (a.position ?? 0) - (b.position ?? 0);
    const pass = (t: Task) =>
      this.matchesFilter(t) &&
      (this.statusFilter === 'all' || t.status === this.statusFilter);

    this.lists.todo        = this.tasks.filter(t => t.status === 'todo'        && pass(t)).sort(byPos);
    this.lists.in_progress = this.tasks.filter(t => t.status === 'in_progress' && pass(t)).sort(byPos);
    this.lists.done        = this.tasks.filter(t => t.status === 'done'        && pass(t)).sort(byPos);
  }

  refresh() {
    this.api.list(this.orgId).subscribe({
      next: (items) => {
        this.tasks = (items as Task[]).map(t => ({ ...t, status: (t.status as Status) ?? 'todo' }));
        this.rebuild();
        // success => remember this org as accessible
        this.lastGoodOrgId = this.orgId;
        this.persistOrg();
      },
      error: (err) => {
        console.error('List failed', err);
        if (err.status === 403) {
          // revert to last accessible org and inform user
          const bad = this.orgId;
          this.openPopup(`You don’t have access to organization ${bad}. Reverting to ${this.lastGoodOrgId}.`);
          this.orgId = this.lastGoodOrgId;
          this.orgIdInput = this.lastGoodOrgId;
          this.persistOrg();
          // try to reload the last good org so UI is consistent
          this.api.list(this.orgId).subscribe(items2 => {
            this.tasks = (items2 as Task[]).map(t => ({ ...t, status: (t.status as Status) ?? 'todo' }));
            this.rebuild();
          });
        } else {
          alert('Could not load tasks.');
        }
      }
    });
  }

  // --- popup helpers
  openPopup(msg: string) { this.popupMsg = msg; }
  closePopup() { this.popupMsg = null; }

  // --- create
  onSubmit(ev: Event) { ev.preventDefault(); this.add(); }

  add() {
    const title = (this.title ?? '').trim();
    const description = (this.desc ?? '').trim() || undefined;
    if (!title) return;
    this.api.create({ orgId: this.orgId, title, description }).subscribe({
      next: () => { this.title = ''; this.desc = ''; this.refresh(); },
      error: (err) => {
        console.error('Create failed', err);
        if (err.status === 403) this.openPopup('Not allowed for your role.');
        else if (err.status === 400) alert('Bad request: ' + (err.error?.message ?? 'invalid payload'));
        else alert('Could not create task.');
      }
    });
  }

  // --- edit title/description
  startEdit(t: Task) { this.editingId = t.id; this.editTitle = t.title; this.editDesc = t.description ?? ''; }
  cancelEdit() { this.editingId = null; this.editTitle = ''; this.editDesc = ''; }
  saveEdit(t: Task) {
    const newTitle = (this.editTitle ?? '').trim();
    const newDesc  = (this.editDesc ?? '').trim();
    if (!newTitle && !newDesc) { this.cancelEdit(); return; }

    const old = { title: t.title, description: t.description };
    if (newTitle) t.title = newTitle;
    t.description = newDesc || undefined;

    this.api.update(t.id, { title: newTitle || undefined, description: newDesc || undefined }).subscribe({
      next: () => this.cancelEdit(),
      error: (err) => {
        t.title = old.title;
        t.description = old.description;
        console.error('Update failed', err);
        if (err.status === 403) this.openPopup('Not allowed for your role.');
        else alert('Could not save changes.');
      }
    });
  }

  // --- status buttons
  mark(t: Task, status: Status) {
    if (t.status === status) return;
    const old = t.status;
    t.status = status;
    this.api.update(t.id, { status }).subscribe({
      next: () => this.refresh(),
      error: (err) => {
        t.status = old;
        if (err.status === 403) this.openPopup('Not allowed for your role.');
        else alert('Could not update status.');
      }
    });
  }

  // --- delete
  del(t: Task) {
    this.api.remove(t.id).subscribe({
      next: () => this.refresh(),
      error: (err) => {
        console.error('Delete failed', err);
        if (err.status === 403) this.openPopup('Not allowed for your role.');
        else alert('Could not delete task.');
      }
    });
  }

  // --- drag/drop reorder + cross-column status change
  dropped(ev: CdkDragDrop<Task[]>, target: Status) {
    const same = ev.previousContainer === ev.container;
    if (same) moveItemInArray(ev.container.data, ev.previousIndex, ev.currentIndex);
    else transferArrayItem(ev.previousContainer.data, ev.container.data, ev.previousIndex, ev.currentIndex);

    const moved = ev.container.data[ev.currentIndex];
    const payload: any = { position: ev.currentIndex + 1 };
    if (!same) payload.status = target;

    this.api.update(moved.id, payload).subscribe({
      error: (err) => {
        console.error('Reorder/move failed', err);
        if (err.status === 403) this.openPopup('Not allowed for your role.');
        this.refresh();
      }
    });
  }
}
