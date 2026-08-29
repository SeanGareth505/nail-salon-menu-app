import {
  animate,
  animateChild,
  group,
  query,
  style,
  transition,
  trigger,
} from '@angular/animations';

export const fadeSlide = trigger('fadeSlide', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(var(--sf-lift, 10px))' }),
    animate('var(--sf-dur-normal, 220ms) var(--sf-ease-enter, ease-out)', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
  transition(':leave', [
    animate('var(--sf-dur-fast, 150ms) var(--sf-ease-exit, ease-in)', style({ opacity: 0, transform: 'translateY(calc(var(--sf-lift, 10px) * -0.5))' })),
  ]),
]);

export const wizardStep = trigger('wizardStep', [
  transition(':increment', [
    style({ opacity: 0, transform: 'translateX(12px)' }),
    animate('var(--sf-dur-normal, 220ms) var(--sf-ease-enter)', style({ opacity: 1, transform: 'translateX(0)' })),
  ]),
  transition(':decrement', [
    style({ opacity: 0, transform: 'translateX(-12px)' }),
    animate('var(--sf-dur-normal, 220ms) var(--sf-ease-enter)', style({ opacity: 1, transform: 'translateX(0)' })),
  ]),
]);

export const expandCollapse = trigger('expandCollapse', [
  transition(':enter', [
    style({ height: 0, opacity: 0, overflow: 'hidden' }),
    animate('var(--sf-dur-normal, 220ms) var(--sf-ease-enter)', style({ height: '*', opacity: 1 })),
  ]),
  transition(':leave', [
    style({ overflow: 'hidden' }),
    animate('var(--sf-dur-fast, 150ms) var(--sf-ease-exit)', style({ height: 0, opacity: 0 })),
  ]),
]);

export const listStagger = trigger('listStagger', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(var(--sf-lift, 10px))' }),
      animate('var(--sf-dur-normal, 220ms) var(--sf-ease-enter)', style({ opacity: 1, transform: 'translateY(0)' })),
    ], { optional: true }),
  ]),
]);

export const overlayEnter = trigger('overlayEnter', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.98) translateY(8px)' }),
    animate('var(--sf-dur-slow, 280ms) var(--sf-ease-enter)', style({ opacity: 1, transform: 'scale(1) translateY(0)' })),
  ]),
  transition(':leave', [
    animate('var(--sf-dur-fast, 150ms) var(--sf-ease-exit)', style({ opacity: 0, transform: 'scale(0.98) translateY(4px)' })),
  ]),
]);

export const routeChildren = trigger('routeChildren', [
  transition('* <=> *', [
    query(':enter', [style({ opacity: 0 }), animateChild()], { optional: true }),
    query(':leave', [animateChild()], { optional: true }),
  ]),
]);
