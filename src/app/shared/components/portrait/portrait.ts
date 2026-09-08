import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

@Component({
  selector: 'sf-portrait',
  standalone: true,
  template: `
    @if (src() && failedSource() !== src()) {
      <img
        [src]="src()"
        [alt]="alt()"
        [attr.loading]="eager() ? 'eager' : 'lazy'"
        decoding="async"
        (error)="failedSource.set(src())"
      />
    } @else {
      <span role="img" [attr.aria-label]="alt()">{{ initial() }}</span>
    }
  `,
  styles: `
    :host {
      display: grid;
      place-items: center;
      overflow: hidden;
    }
    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 30%;
    }
    span {
      display: grid;
      place-items: center;
      width: 100%;
      height: 100%;
      font: inherit;
      color: inherit;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SfPortrait {
  readonly src = input<string | null | undefined>();
  readonly alt = input('');
  readonly initial = input('');
  readonly eager = input(false);
  readonly failedSource = signal<string | null | undefined>(undefined);
}
