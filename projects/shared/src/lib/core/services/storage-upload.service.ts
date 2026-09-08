import { inject, Injectable } from '@angular/core';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { AuthService } from '../auth/auth.service';
import { LoadingService } from './loading.service';

@Injectable({ providedIn: 'root' })
export class StorageUploadService {
  private readonly storage = inject(Storage);
  private readonly auth = inject(AuthService);
  private readonly loading = inject(LoadingService);

  async uploadBrandingLogo(file: File): Promise<string> {
    return this.uploadFile(file, 'branding', 'Uploading logo…');
  }

  async uploadTreatmentImage(file: File, treatmentId: string): Promise<string> {
    return this.uploadFile(file, `catalogue/treatments/${treatmentId}`, 'Uploading image…');
  }

  async uploadTherapistImage(file: File, therapistId: string): Promise<string> {
    return this.uploadFile(
      file,
      `catalogue/therapists/${therapistId}`,
      'Uploading therapist photo…',
    );
  }

  private async uploadFile(file: File, folder: string, message: string): Promise<string> {
    return this.loading.run(async () => {
      const uid = this.auth.currentUid() ?? 'unknown';
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${folder}/${uid}-${Date.now()}-${safeName}`;
      const storageRef = ref(this.storage, path);
      await uploadBytes(storageRef, file, { contentType: file.type });
      return getDownloadURL(storageRef);
    }, message);
  }
}
