import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UsersService } from '../../../core/services/users.service';

@Component({
  selector: 'app-users',
  standalone: true,
  templateUrl: './users.html',
  styleUrl: './users.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Users {
  private readonly usersSvc = inject(UsersService);
  readonly users = toSignal(this.usersSvc.listAll(), { initialValue: [] });
}
