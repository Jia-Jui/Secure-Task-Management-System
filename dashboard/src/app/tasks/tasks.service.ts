import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TasksApi {
  base = '/api/tasks';
  constructor(private http: HttpClient) {}
  list(orgId: number) { return this.http.get<any[]>(`${this.base}?orgId=${orgId}`); }
  create(dto: { orgId: number; title: string; description?: string }) {
  return this.http.post(this.base, dto);
  }
  update(id: number, dto: any) { return this.http.put(`${this.base}/${id}`, dto); }
  remove(id: number)  { return this.http.delete(`${this.base}/${id}`); }
}
