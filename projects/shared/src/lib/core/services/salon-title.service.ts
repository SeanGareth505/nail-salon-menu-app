import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { DEFAULT_SALON_NAME, DEFAULT_SALON_SUBTEXT, SalonIdentityService } from './salon-identity.service';

@Injectable({ providedIn: 'root' })
export class SalonTitleService {
  private readonly title = inject(Title);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly identity = inject(SalonIdentityService);

  init(): void {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.apply());

    effect(() => {
      this.identity.name();
      this.identity.subtext();
      this.apply();
    });
  }

  private apply(): void {
    const salonName = this.identity.name();
    const subtext = this.identity.subtext();
    const routeTitle = this.deepestRouteTitle() ?? salonName;
    const resolved = routeTitle
      .replaceAll(DEFAULT_SALON_NAME, salonName)
      .replaceAll(DEFAULT_SALON_SUBTEXT, subtext);
    this.title.setTitle(resolved);

    const meta = this.document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        'content',
        `${salonName} — ${subtext}. Treatments, specials and the team, plus consultation and consent tools for the salon floor.`,
      );
    }
  }

  private deepestRouteTitle(): string | undefined {
    let route = this.router.routerState.snapshot.root;
    let title: string | undefined;
    while (route.firstChild) {
      route = route.firstChild;
      if (route.title) title = route.title;
    }
    return title;
  }
}
