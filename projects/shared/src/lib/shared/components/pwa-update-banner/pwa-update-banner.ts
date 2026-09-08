import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PwaService } from '../../../core/pwa/pwa.service';
import { SalonIdentityService } from '../../../core/services/salon-identity.service';
import { overlayEnter } from '../../animations/motion.animations';

@Component({
  selector: 'sf-pwa-update-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [overlayEnter],
  template: `
    @if (pwa.updateAvailable()) {
      <div class="banner" role="status" @overlayEnter>
        <div class="banner-mark">{{ identity.markInitial() }}</div>
        <div class="banner-copy">
          <span class="banner-title">A fresh version is available</span>
          <span class="banner-sub">Update {{ identity.name() }} to the latest build</span>
        </div>
        <div class="actions">
          <button type="button" class="primary" (click)="pwa.activateUpdate()">Update now</button>
          <button type="button" class="ghost" (click)="pwa.dismissUpdate()">Later</button>
        </div>
      </div>
    }
  `,
  styles: [`
    .banner {
      position: fixed;
      left: 50%;
      bottom: calc(var(--sf-space-4) + env(safe-area-inset-bottom));
      transform: translateX(-50%);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      border: 1px solid rgba(201, 169, 110, 0.4);
      border-radius: var(--sf-radius-sm);
      background: var(--sf-surface);
      box-shadow: var(--sf-shadow-card);
      max-width: min(92vw, 520px);
      flex-wrap: wrap;
    }

    .banner-mark {
      width: 38px;
      height: 38px;
      flex: none;
      border-radius: 9px;
      background: var(--sf-forest);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--sf-on-forest);
      font-family: var(--sf-font-display);
      font-weight: 600;
      font-size: 0.9375rem;
    }

    .banner-copy {
      flex: 1;
      min-width: 0;
    }

    .banner-title {
      display: block;
      font-weight: 500;
      font-size: 0.8125rem;
      color: var(--sf-ink);
    }

    .banner-sub {
      display: block;
      font-weight: 300;
      font-size: 0.719rem;
      color: rgba(51, 51, 51, 0.55);
      margin-top: 2px;
    }

    .actions {
      display: flex;
      gap: var(--sf-space-2);
      margin-left: auto;
    }

    button {
      border: none;
      border-radius: var(--sf-radius-pill);
      padding: 10px 14px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      font-size: 0.75rem;
      font-family: var(--sf-font-body);
    }

    .primary {
      background: var(--sf-champagne);
      color: #fff;
    }

    .ghost {
      background: transparent;
      color: var(--sf-forest);
      border: 1px solid rgba(74, 107, 87, 0.35);
    }
  `],
})
export class SfPwaUpdateBanner {
  readonly pwa = inject(PwaService);
  readonly identity = inject(SalonIdentityService);
}
