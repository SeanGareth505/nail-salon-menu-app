import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'sf-admin-toggle',
  standalone: true,
  templateUrl: './admin-toggle.html',
  styleUrl: './admin-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SfAdminToggle {
  readonly label = input.required<string>();
  readonly checked = input(false);
  readonly disabled = input(false);

  readonly checkedChange = output<boolean>();

  toggle(): void {
    if (this.disabled()) return;
    this.checkedChange.emit(!this.checked());
  }
}
