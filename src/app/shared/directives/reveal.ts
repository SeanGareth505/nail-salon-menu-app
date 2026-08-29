import { AfterViewInit, Directive, ElementRef, inject, input, OnDestroy } from '@angular/core';
import { MotionService } from '../../core/motion/motion.service';

@Directive({
  selector: '[sfReveal]',
  standalone: true,
})
export class SfRevealDirective implements AfterViewInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly motion = inject(MotionService);

  readonly sfRevealDelay = input(0, { alias: 'sfRevealDelay' });
  readonly sfRevealOnce = input(true, { alias: 'sfRevealOnce' });

  private observer: IntersectionObserver | null = null;
  private revealed = false;

  ngAfterViewInit(): void {
    const node = this.el.nativeElement;
    node.setAttribute('data-sf-reveal', '');
    node.style.setProperty('--sf-reveal-delay', this.motion.staggerDelay(this.sfRevealDelay(), 70));

    if (this.motion.reducedMotion()) {
      node.setAttribute('data-sf-reveal', 'in');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          node.setAttribute('data-sf-reveal', 'in');
          this.revealed = true;
          if (this.sfRevealOnce()) this.observer?.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
