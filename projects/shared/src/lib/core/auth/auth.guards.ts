import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { AuthService } from './auth.service';

function waitUntilReady(auth: AuthService) {
  return toObservable(auth.ready).pipe(
    filter((ready) => ready === true),
    take(1),
  );
}

export const tabletKioskGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  await auth.ensureTabletKioskSession();
  return true;
};

export const adminAreaGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return waitUntilReady(auth).pipe(
    map(() => {
      if (auth.isSignedIn() && auth.isAdmin()) return true;
      return router.createUrlTree(['/login'], { queryParams: { redirect: 'admin' } });
    }),
  );
};
