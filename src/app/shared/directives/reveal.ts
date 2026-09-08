import { AfterViewInit, Directive, ElementRef, inject, input, OnDestroy } from '@angular/core';
import { MotionService } from '../../core/motion/motion.service';

type SfRevealMode = 'block' | 'stagger';

@Directive({
  selector: '[sfReveal]',
  standalone: true,
})
export class SfRevealDirective implements AfterViewInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly motion = inject(MotionService);

  readonly sfRevealDelay = input(0, { alias: 'sfRevealDelay' });
  readonly sfRevealOnce = input(true, { alias: 'sfRevealOnce' });
  readonly sfRevealMode = input<SfRevealMode>('block', { alias: 'sfRevealMode' });

  private observer: IntersectionObserver | null = null;

  ngAfterViewInit(): void {
    const node = this.el.nativeElement;
    const mode = this.sfRevealMode();

    node.setAttribute('data-sf-reveal', '');
    node.setAttribute('data-sf-reveal-mode', mode);
    node.style.setProperty('--sf-reveal-delay', this.motion.staggerDelay(this.sfRevealDelay(), 0));

    if (this.motion.reducedMotion()) {
      node.setAttribute('data-sf-reveal', 'in');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          node.setAttribute('data-sf-reveal', 'in');
          if (this.sfRevealOnce()) this.observer?.disconnect();
        }
      },
      { threshold: 0.06, rootMargin: '48px 0px -2% 0px' },
    );
    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

@Directive({
  selector: '[sfRevealStagger]',
  standalone: true,
})
export class SfRevealStaggerDirective implements AfterViewInit {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly motion = inject(MotionService);

  readonly sfRevealStaggerIndex = input(0, { alias: 'sfRevealStaggerIndex' });

  ngAfterViewInit(): void {
    const node = this.el.nativeElement;
    node.classList.add('sf-reveal-stagger');
    node.style.setProperty(
      '--sf-reveal-stagger-delay',
      this.motion.staggerDelay(this.sfRevealStaggerIndex(), 52),
    );
  }
}
