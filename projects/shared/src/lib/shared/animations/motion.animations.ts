import {
  animate,
  animateChild,
  group,
  query,
  style,
  transition,
  trigger,
} from '@angular/animations';

const SF_DUR_NORMAL = '220ms';
const SF_DUR_FAST = '150ms';
const SF_DUR_SLOW = '280ms';
const SF_EASE_ENTER = 'cubic-bezier(0.05, 0.7, 0.1, 1)';
const SF_EASE_EXIT = 'cubic-bezier(0.3, 0, 0.8, 0.15)';
const SF_LIFT = '10px';

export const fadeSlide = trigger('fadeSlide', [
  transition(':enter', [
    style({ opacity: 0, transform: `translateY(${SF_LIFT})` }),
    animate(`${SF_DUR_NORMAL} ${SF_EASE_ENTER}`, style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
  transition(':leave', [
    animate(`${SF_DUR_FAST} ${SF_EASE_EXIT}`, style({ opacity: 0, transform: `translateY(calc(${SF_LIFT} * -0.5))` })),
  ]),
]);

export const wizardStep = trigger('wizardStep', [
  transition(':increment', [
    style({ opacity: 0, transform: 'translateX(12px)' }),
    animate(`${SF_DUR_NORMAL} ${SF_EASE_ENTER}`, style({ opacity: 1, transform: 'translateX(0)' })),
  ]),
  transition(':decrement', [
    style({ opacity: 0, transform: 'translateX(-12px)' }),
    animate(`${SF_DUR_NORMAL} ${SF_EASE_ENTER}`, style({ opacity: 1, transform: 'translateX(0)' })),
  ]),
]);

export const expandCollapse = trigger('expandCollapse', [
  transition(':enter', [
    style({ height: 0, opacity: 0, overflow: 'hidden' }),
    animate(`${SF_DUR_NORMAL} ${SF_EASE_ENTER}`, style({ height: '*', opacity: 1 })),
  ]),
  transition(':leave', [
    style({ overflow: 'hidden' }),
    animate(`${SF_DUR_FAST} ${SF_EASE_EXIT}`, style({ height: 0, opacity: 0 })),
  ]),
]);

export const listStagger = trigger('listStagger', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: `translateY(${SF_LIFT})` }),
      animate(`${SF_DUR_NORMAL} ${SF_EASE_ENTER}`, style({ opacity: 1, transform: 'translateY(0)' })),
    ], { optional: true }),
  ]),
]);

export const overlayEnter = trigger('overlayEnter', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.98) translateY(8px)' }),
    animate(`${SF_DUR_SLOW} ${SF_EASE_ENTER}`, style({ opacity: 1, transform: 'scale(1) translateY(0)' })),
  ]),
  transition(':leave', [
    animate(`${SF_DUR_FAST} ${SF_EASE_EXIT}`, style({ opacity: 0, transform: 'scale(0.98) translateY(4px)' })),
  ]),
]);

export const routeChildren = trigger('routeChildren', [
  transition('* <=> *', [
    query(':enter', [style({ opacity: 0 }), animateChild()], { optional: true }),
    query(':leave', [animateChild()], { optional: true }),
  ]),
]);
