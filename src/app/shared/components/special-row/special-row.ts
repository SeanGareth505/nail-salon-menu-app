import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Special, SpecialState } from '../../../core/models';
import {
  displayStateLabel,
  resolveDisplayState,
  specialDateMetaLine,
  SpecialDisplayState,
} from '../../../core/specials/special-pricing.util';
import { FormatRandPipe } from '../../pipes/format-rand.pipe';

@Component({
  selector: 'sf-special-row',
  standalone: true,
  imports: [FormatRandPipe],
  templateUrl: './special-row.html',
  styleUrl: './special-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SfSpecialRow {
  readonly special = input.required<Special>();
  readonly therapistNamesInput = input<string[]>([], { alias: 'therapistNames' });
  readonly treatmentNamesInput = input<string[]>([], { alias: 'treatmentNames' });
  readonly effectiveState = input<SpecialState | undefined>(undefined);
  readonly upcoming = input(false);

  readonly displayState = computed((): SpecialDisplayState => {
    const override = this.effectiveState();
    if (override && override !== 'live') return override;
    return resolveDisplayState(this.special());
  });

  readonly stateLabel = computed(() => displayStateLabel(this.displayState()));

  readonly dateMetaLine = computed(() =>
    specialDateMetaLine(this.special(), this.displayState()),
  );

  readonly savingsAmount = computed(() => this.special().originalPrice - this.special().price);

  readonly showPricing = computed(() => this.special().kind !== 'promo' && this.special().price > 0);

  readonly showSavings = computed(() => this.showPricing() && this.savingsAmount() > 0);

  readonly appliesLine = computed(() => {
    const therapists = this.therapistNamesInput().join(' · ');
    if (therapists) return therapists;
    return this.treatmentNamesInput().join(' · ');
  });

  readonly statusTone = computed(() => {
    const state = this.displayState();
    if (state === 'live') return 'live';
    if (state === 'ending-soon') return 'ending';
    if (state === 'scheduled') return 'upcoming';
    return 'neutral';
  });
}
