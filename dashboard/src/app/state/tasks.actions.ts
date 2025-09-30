import { createAction, props } from '@ngrx/store';
export const loadTasks = createAction('[Tasks] Load', props<{ orgId: number }>());
export const setTasks  = createAction('[Tasks] Set',  props<{ tasks: any[] }>());
