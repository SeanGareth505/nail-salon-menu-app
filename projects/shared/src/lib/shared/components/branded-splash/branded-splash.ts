import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MotionService } from '../../../core/motion/motion.service';
import { SalonIdentityService } from '../../../core/services/salon-identity.service';
import { SfSalonLoader } from '../salon-loader/salon-loader';

@Component({
  selector: 'sf-branded-splash',
  standalone: true,
  imports: [SfSalonLoader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './branded-splash.html',
  styleUrl: './branded-splash.scss',
})
export class SfBrandedSplash {
  readonly motion = inject(MotionService);
  readonly identity = inject(SalonIdentityService);
}
