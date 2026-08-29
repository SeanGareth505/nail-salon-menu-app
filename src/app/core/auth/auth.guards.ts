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

export const therapistAreaGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return waitUntilReady(auth).pipe(
    map(() => {
      if (auth.isSignedIn() && auth.isTherapist()) return true;
      if (auth.isSignedIn() && auth.isAdmin()) return router.createUrlTree(['/admin']);
      return router.createUrlTree(['/login/therapist'], { queryParams: { to: state.url } });
    }),
  );
};

export const adminAreaGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return waitUntilReady(auth).pipe(
    map(() => {
      if (auth.isSignedIn() && auth.isAdmin()) return true;
      if (auth.isSignedIn() && auth.isTherapist()) return router.createUrlTree(['/therapist']);
      return router.createUrlTree(['/login'], { queryParams: { redirect: 'admin' } });
    }),
  );
};
