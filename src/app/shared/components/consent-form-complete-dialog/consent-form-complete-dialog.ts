import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { SfIcon } from '../icon/icon';
import { SfConsentFormCompletePanel } from '../consent-form-complete-panel/consent-form-complete-panel';

export interface ConsentFormCompleteDialogData {
  consultationId: string;
  clientName: string;
  intendedTherapistId: string | null;
}

export type ConsentFormCompleteDialogResult = 'completed' | undefined;

@Component({
  selector: 'sf-consent-form-complete-dialog',
  standalone: true,
  imports: [SfIcon, SfConsentFormCompletePanel],
  templateUrl: './consent-form-complete-dialog.html',
  styleUrl: './consent-form-complete-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SfConsentFormCompleteDialog {
  private readonly dialogRef = inject(DialogRef<ConsentFormCompleteDialogResult>);
  readonly data = inject<ConsentFormCompleteDialogData>(DIALOG_DATA);

  dismiss(): void {
    this.dialogRef.close();
  }

  onCompleted(): void {
    this.dialogRef.close('completed');
  }
}
