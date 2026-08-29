import { inject, Injectable } from '@angular/core';
import { Firestore, doc, deleteDoc, updateDoc } from '@angular/fire/firestore';
import { BrandingService } from './branding.service';
import { SalonSettingsService } from './salon-settings.service';
import {
  BLANK_SALON_SETTINGS,
  DEMO_CATALOGUE_IDS,
  DEMO_SEED_SOURCE,
  STARTER_BRANDING,
} from '../demo/demo-catalogue.constants';

@Injectable({ providedIn: 'root' })
export class DemoDataService {
  private readonly firestore = inject(Firestore);
  private readonly settingsSvc = inject(SalonSettingsService);
  private readonly brandingSvc = inject(BrandingService);

  async clearDemoCatalogueAndStartFresh(): Promise<void> {
    await Promise.all([
      ...DEMO_CATALOGUE_IDS.categories.map((id) => this.deleteDoc('categories', id)),
      ...DEMO_CATALOGUE_IDS.therapists.map((id) => this.deleteDoc('therapists', id)),
      ...DEMO_CATALOGUE_IDS.treatments.map((id) => this.deleteDoc('treatments', id)),
      ...DEMO_CATALOGUE_IDS.specials.map((id) => this.deleteDoc('specials', id)),
    ]);

    for (const id of DEMO_CATALOGUE_IDS.consentTemplates) {
      await updateDoc(doc(this.firestore, `consentTemplates/${id}`), { active: false, seedSource: DEMO_SEED_SOURCE });
    }

    await this.settingsSvc.save(BLANK_SALON_SETTINGS);
    await this.brandingSvc.save(STARTER_BRANDING);
  }

  private async deleteDoc(collectionPath: string, id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, `${collectionPath}/${id}`));
  }
}
