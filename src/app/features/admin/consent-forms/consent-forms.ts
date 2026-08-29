import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ConsentTemplatesService } from '../../../core/services/consent-templates.service';
import { ConsentTemplateVersionsService } from '../../../core/services/consent-template-versions.service';
import { TreatmentsService } from '../../../core/services/treatments.service';
import {
  ConsentField,
  ConsentFieldType,
  ConsentStepDefinition,
  ConsentTemplate,
  ConsentTemplateVersion,
} from '../../../core/models';

const FIELD_TYPES: ConsentFieldType[] = [
  'text', 'textarea', 'email', 'phone', 'number', 'date', 'yes_no', 'yes_no_unsure',
  'dropdown', 'radio', 'multi_select', 'checkbox', 'information', 'warning', 'acknowledgement', 'signature', 'image',
];

@Component({
  selector: 'app-consent-forms',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './consent-forms.html',
  styleUrl: './consent-forms.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsentForms {
  private readonly templatesSvc = inject(ConsentTemplatesService);
  private readonly versionsSvc = inject(ConsentTemplateVersionsService);
  private readonly treatmentsSvc = inject(TreatmentsService);

  readonly fieldTypes = FIELD_TYPES;
  readonly templates = toSignal(this.templatesSvc.listAll(), { initialValue: [] });
  readonly treatments = toSignal(this.treatmentsSvc.listActive(), { initialValue: [] });

  readonly selectedTemplateId = signal<string | null>(null);
  readonly selectedTemplate = computed(() => this.templates().find((t) => t.id === this.selectedTemplateId()) ?? null);

  readonly versions = signal<ConsentTemplateVersion[]>([]);
  readonly draftSteps = signal<ConsentStepDefinition[]>([]);
  readonly draftFields = signal<ConsentField[]>([]);
  readonly draftVersionId = signal<string | null>(null);

  readonly newTemplateName = signal('');

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
    if (!this.newTemplateName().trim()) return;
    const id = await this.templatesSvc.create({
      name: this.newTemplateName().trim(),
      description: '',
      treatmentIds: [],
      currentPublishedVersionId: null,
      draftVersionId: null,
      active: true,
    } as any);
    this.newTemplateName.set('');
    const versionId = await this.versionsSvc.createDraft(id);
    await this.templatesSvc.update(id, { draftVersionId: versionId } as any);
  }

  async startDraft(): Promise<void> {
    const template = this.selectedTemplate();
    if (!template) return;
    const published = this.versions().find((v) => v.id === template.currentPublishedVersionId);
    const versionId = await this.versionsSvc.createDraft(
      template.id,
      published ? { steps: published.steps, fields: published.fields } : undefined,
    );
    await this.templatesSvc.update(template.id, { draftVersionId: versionId } as any);
    this.select(template);
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
}
