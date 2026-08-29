import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Special } from '../../../core/models';
import { SfStatePill } from '../state-pill/state-pill';

@Component({
  selector: 'sf-special-card',
  standalone: true,
  imports: [SfStatePill],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="card sf-motion-card">
      <div class="panel" [class]="'tint-' + panelTint()">
        <div class="panel-frame"></div>
        <sf-state-pill [tone]="special().state === 'live' ? 'live' : 'ending'" class="badge">
          {{ stateLabel() }}
        </sf-state-pill>
        <p class="sf-script script-title">{{ special().scriptTitle || special().title }}</p>
      </div>
      <div class="content">
        <h3>{{ special().title }}</h3>
        <p class="desc">{{ special().description }}</p>
        <div class="price-row">
          <span class="price">R{{ special().price }}</span>
          <span class="original">R{{ special().originalPrice }}</span>
          <span class="save">Save R{{ special().originalPrice - special().price }}</span>
        </div>
        <div class="meta-row">
          <span>Until {{ endsAtLabel() }}</span>
          <span>{{ therapistNames() }}</span>
        </div>
        <p class="fine-print">{{ special().finePrint }}</p>
      </div>
    </article>
  `,
  styles: [`
    .card {
      overflow: hidden;
      margin-bottom: 26px;
      border: 1px solid rgba(201, 169, 110, 0.32);
      background: var(--sf-surface);
      animation: sf-motion-rise-in var(--sf-dur-normal) var(--sf-ease-enter) both;
    }
    .panel {
      position: relative;
      padding: var(--sf-space-6) var(--sf-space-4);
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--sf-space-3);
      min-height: 168px;
      justify-content: center;
      overflow: hidden;
    }
    .panel-frame {
      position: absolute;
      inset: 14px;
      border: 1px solid rgba(201, 169, 110, 0.35);
      pointer-events: none;
    }
    .tint-sage { background: var(--sf-sage-light); }
    .tint-blush { background: var(--sf-blush); }
    .tint-sky { background: var(--sf-sky); }
    .tint-sand { background: var(--sf-sand); }
    .badge { position: absolute; top: 12px; left: 12px; z-index: 1; }
    .script-title { font-size: 1.9rem; margin: 0; align-self: center; text-align: center; width: 100%; position: relative; z-index: 1; color: rgba(74, 107, 87, 0.55); }
    .content { padding: 18px; }
    h3 { font-size: 1.3rem; font-weight: 400; margin: 0 0 6px; }
    .desc { color: var(--sf-ink-muted); font-weight: 300; line-height: 1.6; }
    .price-row { display: flex; align-items: baseline; gap: 10px; margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid rgba(74, 107, 87, 0.12); }
    .price { font-size: 1.5rem; font-weight: 500; color: var(--sf-forest); }
    .original { text-decoration: line-through; color: rgba(51, 51, 51, 0.4); font-weight: 300; }
    .save { margin-left: auto; color: var(--sf-champagne-ink); font-weight: 500; font-size: 0.75rem; }
    .meta-row { display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--sf-ink-muted); font-weight: 300; }
    .fine-print { font-size: 0.72rem; color: rgba(51, 51, 51, 0.42); margin: 10px 0 0; font-weight: 300; line-height: 1.6; }
  `],
})
export class SfSpecialCard {
  readonly special = input.required<Special>();
  readonly therapistNamesInput = input<string[]>([], { alias: 'therapistNames' });
  readonly therapistNames = computed(() => this.therapistNamesInput().join(' · '));
  readonly endsAtLabel = computed(() => {
    const d = new Date(this.special().endsAt);
    return isNaN(d.getTime()) ? this.special().endsAt : d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  });
  readonly stateLabel = computed(() => {
    const s = this.special().state;
    if (s === 'live') return 'Live';
    if (s === 'scheduled') return 'Upcoming';
    if (s === 'expired') return 'Expired';
    return 'Ending soon';
  });
  readonly panelTint = computed(() => {
    const s = this.special().state;
    if (s === 'live') return 'sage';
    if (s === 'scheduled') return 'sky';
    return 'blush';
  });
}
