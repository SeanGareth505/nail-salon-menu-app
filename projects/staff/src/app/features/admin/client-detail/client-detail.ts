import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SfClientProfile } from '@shared/components/client-profile/client-profile';

@Component({
  selector: 'app-admin-client-detail',
  standalone: true,
  imports: [SfClientProfile],
  template: `<sf-client-profile [id]="id()" area="admin" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminClientDetail {
  readonly id = input.required<string>();
}
