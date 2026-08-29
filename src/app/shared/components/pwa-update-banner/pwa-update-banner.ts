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
        <span>A fresh version of {{ identity.name() }} is available.</span>
        <div class="actions">
          <button type="button" class="primary" (click)="pwa.activateUpdate()">Update now</button>
          <button type="button" class="ghost" (click)="pwa.dismissUpdate()">Later</button>
        </div>
      </div>
    }
    @if (pwa.canInstall()) {
      <div class="banner install" role="status" @overlayEnter>
        <span>Install {{ identity.name() }} for quick access on this device.</span>
        <button type="button" class="primary" (click)="install()">Install</button>
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
      gap: var(--sf-space-3);
      padding: 14px 16px;
      border-radius: var(--sf-radius-lg);
      background: var(--sf-forest);
      color: #fff;
      box-shadow: var(--sf-shadow-raised);
      font-size: 0.85rem;
      max-width: min(92vw, 520px);
      flex-wrap: wrap;
    }
    .banner.install { bottom: calc(var(--sf-space-4) + env(safe-area-inset-bottom) + 72px); }
    .actions { display: flex; gap: var(--sf-space-2); margin-left: auto; }
    button {
      border: none;
      border-radius: var(--sf-radius-pill);
      padding: 8px 14px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      font-size: 0.82rem;
    }
    .primary { background: #fff; color: var(--sf-forest); }
    .ghost { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.35); }
  `],
})
export class SfPwaUpdateBanner {
  readonly pwa = inject(PwaService);
  readonly identity = inject(SalonIdentityService);

  install(): void {
    void this.pwa.promptInstall();
  }
}
