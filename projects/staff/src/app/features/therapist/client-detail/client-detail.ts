import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SfClientProfile } from '@shared/components/client-profile/client-profile';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [SfClientProfile],
  template: `<sf-client-profile [id]="id()" area="therapist" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientDetail {
  readonly id = input.required<string>();
}
