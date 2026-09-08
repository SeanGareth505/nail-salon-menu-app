import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Special, SpecialState } from '../../../core/models';
import {
  displayStateLabel,
  resolveDisplayState,
  specialDateMetaLine,
  SpecialDisplayState,
} from '../../../core/specials/special-pricing.util';
import { formatRand } from '../../../core/utils/format-rand.util';
import { SfStatePill } from '../state-pill/state-pill';

@Component({
  selector: 'sf-special-card',
  standalone: true,
  imports: [SfStatePill],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (compact()) {
      <article class="card card-compact sf-motion-card">
        <div class="compact-panel" [class]="'tint-' + panelTint()">
          <div class="panel-frame" aria-hidden="true"></div>
          <p class="sf-script compact-script">{{ special().scriptTitle || special().title }}</p>
          @if (showSavings()) {
            <span class="compact-save">Save {{ savingsLabel() }}</span>
          }
        </div>
        <div class="compact-content">
          <h3>{{ special().title }}</h3>
          <p class="desc">{{ special().description }}</p>
          @if (showPricing()) {
            <div class="compact-price-row">
              <span class="price">{{ priceLabel(special().price) }}</span>
              <span class="was">{{ priceLabel(special().originalPrice) }}</span>
              <span class="ends">{{ dateMetaLine() }}</span>
            </div>
          }
        </div>
      </article>
    } @else {
      <article class="card sf-motion-card">
        <div class="panel" [class]="'tint-' + panelTint()">
          <div class="panel-frame" aria-hidden="true"></div>
          <sf-state-pill [tone]="pillTone()" class="state-badge">
            {{ stateLabel() }}
          </sf-state-pill>
          <p class="sf-script script-title">{{ special().scriptTitle || special().title }}</p>
        </div>

        <div class="content">
          <h3>{{ special().title }}</h3>
          <p class="desc">{{ special().description }}</p>

          @if (showPricing()) {
            <div class="price-row">
              <span class="price">{{ priceLabel(special().price) }}</span>
              <span class="was">{{ priceLabel(special().originalPrice) }}</span>
              @if (showSavings()) {
                <span class="save">Save {{ savingsLabel() }}</span>
              }
            </div>
          }

          <div class="meta-line">
            <span>{{ dateMetaLine() }}</span>
            @if (appliesLine()) {
              <span>{{ appliesLine() }}</span>
            }
          </div>

          @if (special().finePrint) {
            <p class="fine-print">{{ special().finePrint }}</p>
          }
        </div>
      </article>
    }
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .card {
      overflow: hidden;
      margin-bottom: 0;
      border: 1px solid rgba(201, 169, 110, 0.32);
      border-radius: 0;
      background: var(--sf-surface);
      box-shadow: none;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .card:hover {
      transform: none;
      box-shadow: none;
      border-color: rgba(201, 169, 110, 0.32);
    }

    .panel {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 186px;
      overflow: hidden;
    }

    .panel-frame {
      position: absolute;
      inset: 14px;
      border: 1px solid rgba(201, 169, 110, 0.35);
      pointer-events: none;
    }

    .tint-sage { background: #F0F4F0; }
    .tint-blush { background: #F7E9E3; }
    .tint-sky { background: #E3F0F9; }
    .tint-sand { background: #F5EFE7; }

    .state-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 2;
    }

    .state-badge ::ng-deep .pill {
      padding: 7px 11px;
      font-size: 0.625rem;
      font-weight: 600;
      letter-spacing: 0.12em;
    }

    .script-title {
      margin: 0;
      max-width: 70%;
      font-size: 2.125rem;
      text-align: center;
      color: rgba(74, 107, 87, 0.5);
      line-height: 1.1;
      text-wrap: balance;
      position: relative;
      z-index: 1;
    }

    .content {
      padding: 18px;
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 0;
    }

    h3 {
      margin: 0 0 6px;
      font-size: 1.3125rem;
      font-weight: 400;
      line-height: 1.2;
    }

    .desc {
      margin: 0 0 14px;
      color: rgba(51, 51, 51, 0.62);
      font-weight: 300;
      line-height: 1.6;
      font-size: 0.844rem;
      text-wrap: pretty;
      flex: 1;
    }

    .price-row {
      display: flex;
      align-items: baseline;
      gap: 10px;
      padding-bottom: 14px;
      border-bottom: 1px solid rgba(74, 107, 87, 0.12);
    }

    .price {
      font-size: 1.5rem;
      font-weight: 500;
      color: var(--sf-forest);
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }

    .was {
      font-size: 0.9375rem;
      text-decoration: line-through;
      color: rgba(51, 51, 51, 0.4);
      font-weight: 300;
    }

    .save {
      margin-left: auto;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--sf-champagne-ink);
    }

    .meta-line {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding-top: 13px;
      font-size: 0.781rem;
      font-weight: 300;
      line-height: 1.5;
      color: rgba(51, 51, 51, 0.55);
    }

    .meta-line span:last-child {
      text-align: right;
    }

    .fine-print {
      margin: 10px 0 0;
      font-size: 0.719rem;
      color: rgba(51, 51, 51, 0.42);
      font-weight: 300;
      line-height: 1.6;
    }

    .card-compact {
      border: 1px solid rgba(201, 169, 110, 0.35);
      border-radius: 3px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .compact-panel {
      position: relative;
      height: 168px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .compact-panel .panel-frame {
      inset: 14px;
    }

    .compact-script {
      margin: 0;
      font-size: 1.875rem;
      color: rgba(74, 107, 87, 0.55);
      text-align: center;
      position: relative;
      z-index: 1;
    }

    .compact-save {
      position: absolute;
      top: 12px;
      left: 12px;
      background: var(--sf-champagne);
      color: #fff;
      font-size: 0.625rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 7px 11px;
      border-radius: 2px;
      z-index: 2;
    }

    .compact-content {
      padding: 16px 18px 18px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .compact-content h3 {
      margin: 0 0 5px;
      font-size: 1.1875rem;
      font-weight: 400;
      line-height: 1.25;
    }

    .compact-content .desc {
      margin: 0 0 12px;
      font-size: 0.8125rem;
      line-height: 1.55;
      flex: 1;
    }

    .compact-price-row {
      display: flex;
      align-items: baseline;
      gap: 10px;
    }

    .compact-price-row .price {
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--sf-forest);
    }

    .compact-price-row .was {
      font-size: 0.875rem;
      font-weight: 300;
      color: rgba(51, 51, 51, 0.4);
      text-decoration: line-through;
    }

    .compact-price-row .ends {
      margin-left: auto;
      font-size: 0.719rem;
      font-weight: 400;
      color: rgba(51, 51, 51, 0.5);
    }

    @media (min-width: 768px) {
      .panel {
        height: 200px;
      }

      .content {
        padding: 22px;
      }

      h3 {
        margin-bottom: 8px;
        font-size: 1.375rem;
      }

      .desc {
        margin-bottom: 16px;
        font-size: 0.844rem;
        line-height: 1.65;
      }

      .price-row {
        padding-bottom: 15px;
      }

      .price {
        font-size: 1.5625rem;
      }

      .save {
        font-size: 0.781rem;
      }

      .meta-line {
        padding-top: 14px;
      }

      .script-title {
        max-width: 72%;
      }
    }
  `],
})
export class SfSpecialCard {
  readonly special = input.required<Special>();
  readonly therapistNamesInput = input<string[]>([], { alias: 'therapistNames' });
  readonly treatmentNamesInput = input<string[]>([], { alias: 'treatmentNames' });
  readonly effectiveState = input<SpecialState | undefined>(undefined);
  readonly compact = input(false);

  readonly displayState = computed((): SpecialDisplayState => {
    const override = this.effectiveState();
    if (override && override !== 'live') return override;
    return resolveDisplayState(this.special());
  });

  readonly savingsAmount = computed(() => this.special().originalPrice - this.special().price);

  readonly showPricing = computed(() => this.special().kind !== 'promo' && this.special().price > 0);

  readonly showSavings = computed(() => this.showPricing() && this.savingsAmount() > 0);

  readonly stateLabel = computed(() => displayStateLabel(this.displayState()));

  readonly dateMetaLine = computed(() =>
    specialDateMetaLine(this.special(), this.displayState(), this.compact()),
  );

  priceLabel(amount: number): string {
    return formatRand(amount);
  }

  savingsLabel(): string {
    return formatRand(this.savingsAmount());
  }

  readonly appliesLine = computed(() => {
    const therapists = this.therapistNamesInput().join(' · ');
    if (therapists) return therapists;
    const treatments = this.treatmentNamesInput().join(' · ');
    return treatments;
  });

  readonly pillTone = computed(() => {
    const s = this.displayState();
    if (s === 'live') return 'live';
    if (s === 'ending-soon') return 'ending';
    if (s === 'scheduled') return 'upcoming';
    return 'neutral';
  });

  readonly panelTint = computed(() => {
    const s = this.displayState();
    if (s === 'live' || s === 'ending-soon') return s === 'ending-soon' ? 'blush' : 'sage';
    if (s === 'scheduled') return 'sky';
    return 'blush';
  });
}
