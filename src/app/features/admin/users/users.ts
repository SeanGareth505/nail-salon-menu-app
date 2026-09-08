import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UsersService } from '../../../core/services/users.service';
import { SfPageActionDirective } from '../../../shared/directives/page-action.directive';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [SfPageActionDirective],
  templateUrl: './users.html',
  styleUrl: './users.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Users {
  private readonly usersSvc = inject(UsersService);
  readonly users = toSignal(this.usersSvc.listAll(), { initialValue: [] });

  readonly pageAction = (): void => {
    window.open('https://console.firebase.google.com/project/_/authentication/users', '_blank', 'noopener');
  };
}
