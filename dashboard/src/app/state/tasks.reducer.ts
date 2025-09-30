import { createReducer, on } from '@ngrx/store';
import { setTasks } from './tasks.actions';
export interface TasksState { items: any[]; }
export const initialState: TasksState = { items: [] };
export const tasksReducer = createReducer(
  initialState,
  on(setTasks, (s, { tasks }) => ({ ...s, items: tasks }))
);
