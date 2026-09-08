import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { ConsentTemplatesService } from '@core/services/consent-templates.service';
import { DefaultConsentTemplateService } from '@core/services/default-consent-template.service';
import { ConsentTemplateVersionsService } from '@core/services/consent-template-versions.service';
import { TreatmentsService } from '@core/services/treatments.service';
import { NotificationDispatcherService } from '@core/services/notification-dispatcher.service';
import { SfPageActionDirective } from '@shared/directives/page-action.directive';
import { SfAdminToggle } from '@shared/components/admin-toggle/admin-toggle';
import {
  DEFAULT_CONSENT_FIELDS,
  DEFAULT_CONSENT_STEPS,
  isBuiltInConsentTemplateId,
} from '@core/consent/default-consent-template';
import {
  ConsentField,
  ConsentFieldType,
  ConsentStepDefinition,
  ConsentTemplate,
  ConsentTemplateVersion,
  isConsentFormLive,
} from '@core/models';

const FIELD_TYPES: ConsentFieldType[] = [
  'text', 'textarea', 'email', 'phone', 'number', 'date', 'yes_no', 'yes_no_unsure',
  'dropdown', 'radio', 'multi_select', 'checkbox', 'information', 'warning', 'acknowledgement', 'signature', 'image',
];

@Component({
  selector: 'app-consent-forms',
  standalone: true,
  imports: [FormsModule, SfPageActionDirective, SfAdminToggle],
  templateUrl: './consent-forms.html',
  styleUrl: './consent-forms.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsentForms {
  private readonly templatesSvc = inject(ConsentTemplatesService);
  private readonly defaultConsentSvc = inject(DefaultConsentTemplateService);
  private startingDraft = false;
  private liveToggleBusy = false;
  private readonly versionsSvc = inject(ConsentTemplateVersionsService);
  private readonly treatmentsSvc = inject(TreatmentsService);
  private readonly route = inject(ActivatedRoute);
  private readonly dispatcher = inject(NotificationDispatcherService);

  readonly pageAction = (): void => {
    const input = document.querySelector<HTMLInputElement>('.consent-forms-page .new-row input');
    input?.focus();
  };

  readonly fieldTypes = FIELD_TYPES;
  readonly templates = toSignal(this.templatesSvc.listAll(), { initialValue: [] });
  readonly sortedTemplates = computed(() => {
    const items = [...this.templates()];
    items.sort((a, b) => {
      if (a.isSystemDefault && !b.isSystemDefault) return -1;
      if (!a.isSystemDefault && b.isSystemDefault) return 1;
      return a.name.localeCompare(b.name);
    });
    return items;
  });
  readonly treatments = toSignal(this.treatmentsSvc.listActive(), { initialValue: [] });
  readonly queryTemplateId = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('template'))),
    { initialValue: null },
  );

  readonly selectedTemplateId = signal<string | null>(null);
  readonly selectedTemplate = computed(() => this.templates().find((t) => t.id === this.selectedTemplateId()) ?? null);

  readonly versions = signal<ConsentTemplateVersion[]>([]);
  readonly draftSteps = signal<ConsentStepDefinition[]>([]);
  readonly draftFields = signal<ConsentField[]>([]);
  readonly draftVersionId = signal<string | null>(null);

  readonly newTemplateName = signal('');

  fieldTypeLabel(type: ConsentFieldType): string {
    if (type === 'textarea') return 'textarea — Notes / comments';
    return type;
  }

  isLive(template: ConsentTemplate): boolean {
    return isConsentFormLive(template);
  }

  constructor() {
    void this.defaultConsentSvc.ensureBuiltInTemplates().catch(() => undefined);
    effect(() => {
      const templateId = this.queryTemplateId();
      const templates = this.templates();
      if (!templateId || !templates.length) return;
      const template = templates.find((t) => t.id === templateId);
      if (template && this.selectedTemplateId() !== template.id) {
        this.select(template);
      }
    });
  }

  select(t: ConsentTemplate): void {
    this.selectedTemplateId.set(t.id);
    this.versionsSvc.listForTemplate(t.id).subscribe((versions) => {
      this.versions.set(versions);
      const draft = versions.find((v) => v.status === 'draft');
      if (draft) {
        this.draftVersionId.set(draft.id);
        this.draftSteps.set([...draft.steps]);
        this.draftFields.set([...draft.fields]);
      } else {
        this.draftVersionId.set(null);
        this.draftSteps.set([]);
        this.draftFields.set([]);
      }
    });
  }

  async createTemplate(): Promise<void> {
    const name = this.newTemplateName().trim();
    if (!name) return;
    const id = await this.templatesSvc.create({
      name,
      description: '',
      treatmentIds: [],
      currentPublishedVersionId: null,
      draftVersionId: null,
      active: true,
    } as any);
    this.newTemplateName.set('');
    const versionId = await this.versionsSvc.createDraft(id, {
      steps: DEFAULT_CONSENT_STEPS,
      fields: DEFAULT_CONSENT_FIELDS,
    });
    await this.templatesSvc.update(id, { draftVersionId: versionId } as any);
    void this.dispatcher.notifyAdmins({
      type: 'consent_form_created',
      title: 'Consent form created',
      body: `${name} was added as a draft.`,
      link: `/admin/consent-forms?template=${id}`,
      entityType: 'consentTemplate',
      entityId: id,
    }).catch(() => undefined);
  }

  async startDraft(): Promise<void> {
    let template = this.selectedTemplate();
    if (!template || this.startingDraft) return;
    if (template.draftVersionId) {
      this.select(template);
      return;
    }
    this.startingDraft = true;
    try {
      if (isBuiltInConsentTemplateId(template.id)) {
        await this.defaultConsentSvc.ensureBuiltInTemplates();
        template = await firstValueFrom(this.templatesSvc.get(template.id)) ?? template;
      }
      if (template.draftVersionId) {
        this.select(template);
        return;
      }
      const published = template.currentPublishedVersionId
        ? await firstValueFrom(this.versionsSvc.get(template.currentPublishedVersionId))
        : undefined;
      if (template.currentPublishedVersionId && !published) {
        throw new Error('The published form could not be loaded. Please try again.');
      }
      const versionId = await this.versionsSvc.createDraft(
        template.id,
        published ? { steps: published.steps, fields: published.fields } : undefined,
      );
      await this.templatesSvc.update(template.id, { draftVersionId: versionId });
      this.select(template);
    } finally {
      this.startingDraft = false;
    }
  }

  addStep(): void {
    const key = `step_${this.draftSteps().length + 1}`;
    this.draftSteps.update((steps) => [...steps, { key, title: 'New step', sortOrder: steps.length + 1 }]);
  }
  removeStep(key: string): void {
    this.draftSteps.update((steps) => steps.filter((s) => s.key !== key));
    this.draftFields.update((fields) => fields.filter((f) => f.step !== key));
  }

  addField(stepKey: string): void {
    const key = `field_${Math.random().toString(36).slice(2, 8)}`;
    this.draftFields.update((fields) => [
      ...fields,
      { key, type: 'text', label: 'New question', required: false, step: stepKey, sortOrder: fields.length + 1 },
    ]);
  }
  removeField(key: string): void {
    this.draftFields.update((fields) => fields.filter((f) => f.key !== key));
  }
  fieldsForStep(stepKey: string): ConsentField[] {
    return this.draftFields().filter((f) => f.step === stepKey);
  }

  updateField(key: string, patch: Partial<ConsentField>): void {
    this.draftFields.update((fields) => fields.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  }
  updateStep(key: string, patch: Partial<ConsentStepDefinition>): void {
    this.draftSteps.update((steps) => steps.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }

  needsOptions(type: ConsentFieldType): boolean {
    return type === 'dropdown' || type === 'radio' || type === 'multi_select';
  }
  needsBody(type: ConsentFieldType): boolean {
    return type === 'information' || type === 'warning' || type === 'acknowledgement';
  }

  optionsText(field: ConsentField): string {
    return (field.options ?? []).map((o) => o.label).join(', ');
  }
  setOptionsFromText(key: string, text: string): void {
    const options = text.split(',').map((s) => s.trim()).filter(Boolean).map((label) => ({ label, value: label.toLowerCase().replace(/[^a-z0-9]+/g, '_') }));
    this.updateField(key, { options });
  }

  async saveDraft(): Promise<void> {
    const versionId = this.draftVersionId();
    if (!versionId) return;
    await this.versionsSvc.updateDraft(versionId, this.draftSteps(), this.draftFields());
  }

  async publish(): Promise<void> {
    const template = this.selectedTemplate();
    const versionId = this.draftVersionId();
    if (!template || !versionId) return;
    await this.saveDraft();
    await this.versionsSvc.publish(template.id, versionId);
    this.select(template);
  }

  async setLive(live: boolean): Promise<void> {
    const template = this.selectedTemplate();
    if (!template || this.liveToggleBusy) return;
    if (live && !template.currentPublishedVersionId) return;
    this.liveToggleBusy = true;
    try {
      await this.templatesSvc.update(template.id, { active: live });
    } finally {
      this.liveToggleBusy = false;
    }
  }
}
