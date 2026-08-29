import { inject, Injectable } from '@angular/core';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class StorageUploadService {
  private readonly storage = inject(Storage);
  private readonly auth = inject(AuthService);

  async uploadBrandingLogo(file: File): Promise<string> {
    const uid = this.auth.currentUid() ?? 'unknown';
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `branding/logo-${uid}-${Date.now()}-${safeName}`;
    const storageRef = ref(this.storage, path);
    await uploadBytes(storageRef, file, { contentType: file.type });
    return getDownloadURL(storageRef);
  }
}
