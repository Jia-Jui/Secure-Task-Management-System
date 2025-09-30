import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const jwt = localStorage.getItem('jwt');
  if (!jwt) { router.navigateByUrl('/login'); return false; }
  try {
    const { exp } = JSON.parse(atob(jwt.split('.')[1] || ''));
    if (exp && Date.now() >= exp * 1000) {
      localStorage.removeItem('jwt');
      router.navigateByUrl('/login');
      return false;
    }
  } catch {}
  return true;
};
