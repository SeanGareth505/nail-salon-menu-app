import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Therapists } from './therapists';
import { TherapistsService } from '../../../core/services/therapists.service';
import { TreatmentsService } from '../../../core/services/treatments.service';
import { StorageUploadService } from '../../../core/services/storage-upload.service';

describe('Therapist photo editor', () => {
  let fixture: ComponentFixture<Therapists>;
  let component: Therapists;
  let upload: jasmine.Spy;
  let create: jasmine.Spy;

  beforeEach(() => {
    upload = jasmine.createSpy('uploadTherapistImage').and.resolveTo('/uploaded-photo.jpg');
    create = jasmine.createSpy('create').and.resolveTo('new-profile');
    TestBed.configureTestingModule({
      imports: [Therapists],
      providers: [
        { provide: TherapistsService, useValue: { listAll: () => of([]), create } },
        { provide: TreatmentsService, useValue: { listAll: () => of([]) } },
        { provide: StorageUploadService, useValue: { uploadTherapistImage: upload } },
      ],
    });
    fixture = TestBed.createComponent(Therapists);
    component = fixture.componentInstance;
    component.startNew();
    component.editing.update((d) => ({ ...d, name: 'Alex Morgan', role: 'Therapist' }));
    fixture.detectChanges();
  });

  function selectFile(file: File): void {
    component.choosePhoto({ target: { files: [file], value: '' } } as unknown as Event);
    fixture.detectChanges();
  }

  it('keeps a selected photo local until the profile is saved', async () => {
    selectFile(new File(['photo'], 'portrait.jpg', { type: 'image/jpeg' }));
    expect(upload).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'Photo selected. Save the profile to publish it.',
    );
    await component.save();
    expect(upload).toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith(
      jasmine.objectContaining({ imageUrl: '/uploaded-photo.jpg', name: 'Alex Morgan' }),
    );
    expect(component.editing()).toBeNull();
  });

  it('discards a pending upload when cancelled', () => {
    selectFile(new File(['photo'], 'portrait.png', { type: 'image/png' }));
    const preview = component.photoPreview();
    const revoke = spyOn(URL, 'revokeObjectURL');
    component.cancel();
    expect(revoke).toHaveBeenCalledWith(preview!);
    expect(component.pendingPhoto()).toBeNull();
    expect(upload).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects unsupported images and oversized files before uploading', () => {
    selectFile(new File(['document'], 'resume.pdf', { type: 'application/pdf' }));
    expect(component.photoError()).toContain('JPG, PNG or WebP');
    selectFile(new File([new Uint8Array(8 * 1024 * 1024)], 'large.png', { type: 'image/png' }));
    expect(component.photoError()).toContain('smaller than 8 MB');
    expect(component.pendingPhoto()).toBeNull();
    expect(upload).not.toHaveBeenCalled();
  });

  it('retains the draft and shows an error when uploading fails', async () => {
    upload.and.rejectWith(new Error('Offline'));
    selectFile(new File(['photo'], 'portrait.jpg', { type: 'image/jpeg' }));
    await component.save();
    fixture.detectChanges();
    expect(component.editing()?.name).toBe('Alex Morgan');
    expect(component.pendingPhoto()).not.toBeNull();
    expect(create).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Could not save',
    );
    expect(component.saving()).toBeFalse();
  });
});
