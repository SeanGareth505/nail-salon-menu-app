import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { LottieComponent, AnimationOptions } from 'ngx-lottie';
import type { AnimationItem } from 'lottie-web';
import { switchMap } from 'rxjs';
import { MotionService } from '../../../core/motion/motion.service';
import { LottieAssetKey } from '../../../core/motion/lottie-assets';
import { LottieLoaderService } from '../../../core/motion/lottie-loader.service';

@Component({
  selector: 'sf-lottie',
  standalone: true,
  imports: [LottieComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @if (options(); as opts) {
    <ng-lottie
      [options]="opts"
      [width]="width()"
      [height]="height()"
      (animationCreated)="onCreated($event)"
    />
  }
  `,
  styles: [`
    :host {
      display: block;
      line-height: 0;
    }
    ng-lottie {
      display: block;
      margin: 0 auto;
    }
  `],
})
export class SfLottiePlayer {
  private readonly motion = inject(MotionService);
  private readonly loader = inject(LottieLoaderService);

  readonly asset = input<LottieAssetKey>('splash');
  readonly width = input('100%');
  readonly height = input('100%');
  readonly loop = input(false);
  readonly autoplay = input(true);
  readonly speed = input(1);

  readonly animationCreated = output<AnimationItem>();

  private readonly animationData = toSignal(
    toObservable(this.asset).pipe(switchMap((asset) => this.loader.load(asset))),
    { initialValue: null },
  );

  readonly options = computed<AnimationOptions | null>(() => {
    const data = this.animationData();
    if (!data) return null;
    return {
      animationData: data,
      loop: this.loop(),
      autoplay: this.motion.reducedMotion() ? false : this.autoplay(),
    };
  });

  onCreated(item: AnimationItem): void {
    item.setSpeed(this.speed());
    if (this.motion.reducedMotion()) {
      item.goToAndStop(item.totalFrames - 1, true);
    }
    this.animationCreated.emit(item);
  }
}
