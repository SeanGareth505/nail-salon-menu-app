import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { ConsentForms } from './consent-forms';
import { ConsentTemplatesService } from '@core/services/consent-templates.service';
import { ConsentTemplateVersionsService } from '@core/services/consent-template-versions.service';
import { DefaultConsentTemplateService } from '@core/services/default-consent-template.service';
import { TreatmentsService } from '@core/services/treatments.service';
import { NotificationDispatcherService } from '@core/services/notification-dispatcher.service';
import {
  DEFAULT_CONSENT_TEMPLATE_ID,
  DEFAULT_CONSENT_VERSION_ID,
  PREVIOUS_DEFAULT_CONSENT_TEMPLATE,
  resolveBundledConsentVersion,
} from '@core/consent/default-consent-template';

describe('Starting a default consent draft', () => {
  function setup(overrides: Record<string, unknown> = {}) {
    const template = {
      id: DEFAULT_CONSENT_TEMPLATE_ID,
      name: 'Default consent',
      isSystemDefault: true,
      active: true,
      draftVersionId: null,
      currentPublishedVersionId: PREVIOUS_DEFAULT_CONSENT_TEMPLATE.versionId,
      ...overrides,
    };
    const latest = { ...template, currentPublishedVersionId: DEFAULT_CONSENT_VERSION_ID };
    const templateGet = jasmine.createSpy('get').and.returnValue(of(latest));
    const versionGet = jasmine.createSpy('get').and.callFake((id: string) => of(resolveBundledConsentVersion(id)));
    const createDraft = jasmine.createSpy('createDraft').and.resolveTo('new-draft');
    const update = jasmine.createSpy('update').and.resolveTo(undefined);
    const ensure = jasmine.createSpy('ensure').and.resolveTo(DEFAULT_CONSENT_TEMPLATE_ID);
    TestBed.configureTestingModule({
      imports: [ConsentForms],
      providers: [
        { provide: ConsentTemplatesService, useValue: { listAll: () => of([template]), get: templateGet, update } },
        { provide: ConsentTemplateVersionsService, useValue: { get: versionGet, createDraft, listForTemplate: () => of([]) } },
        { provide: DefaultConsentTemplateService, useValue: { ensureDefaultTemplate: ensure, ensureBuiltInTemplates: ensure } },
        { provide: TreatmentsService, useValue: { listActive: () => of([]) } },
        { provide: NotificationDispatcherService, useValue: {} },
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap({})) } },
      ],
    }).overrideComponent(ConsentForms, { set: { template: '', imports: [] } });
    const fixture = TestBed.createComponent(ConsentForms);
    const component = fixture.componentInstance;
    component.selectedTemplateId.set(DEFAULT_CONSENT_TEMPLATE_ID);
    return { fixture, component, template, templateGet, versionGet, createDraft, update, ensure };
  }

  it('waits for safe default adoption and clones the newly published version', async () => {
    const state = setup();
    await state.component.startDraft();
    expect(state.ensure).toHaveBeenCalledTimes(1);
    expect(state.versionGet).toHaveBeenCalledWith(DEFAULT_CONSENT_VERSION_ID);
    expect(state.createDraft).toHaveBeenCalledWith(DEFAULT_CONSENT_TEMPLATE_ID, {
      steps: resolveBundledConsentVersion(DEFAULT_CONSENT_VERSION_ID)!.steps,
      fields: resolveBundledConsentVersion(DEFAULT_CONSENT_VERSION_ID)!.fields,
    });
    state.fixture.destroy();
  });

  it('does not create or replace an existing custom draft', async () => {
    const state = setup({ draftVersionId: 'custom-draft' });
    await state.component.startDraft();
    expect(state.ensure).not.toHaveBeenCalled();
    expect(state.createDraft).not.toHaveBeenCalled();
    expect(state.update).not.toHaveBeenCalled();
    state.fixture.destroy();
  });

  it('clones customised published content when the safe upgrade preserves it', async () => {
    const state = setup({ currentPublishedVersionId: 'custom-published' });
    state.templateGet.and.returnValue(of(state.template));
    const custom = resolveBundledConsentVersion(DEFAULT_CONSENT_VERSION_ID)!;
    custom.id = 'custom-published';
    custom.fields[0].label = 'Custom salon wording';
    state.versionGet.and.returnValue(of(custom));
    await state.component.startDraft();
    expect(state.createDraft).toHaveBeenCalledWith(DEFAULT_CONSENT_TEMPLATE_ID, {
      steps: custom.steps,
      fields: custom.fields,
    });
    expect(state.update).toHaveBeenCalledWith(DEFAULT_CONSENT_TEMPLATE_ID, { draftVersionId: 'new-draft' });
    state.fixture.destroy();
  });

  it('does not reactivate a disabled template while preparing its draft', async () => {
    const state = setup({ active: false });
    state.templateGet.and.returnValue(of(state.template));
    await state.component.startDraft();
    expect(state.update).toHaveBeenCalledWith(DEFAULT_CONSENT_TEMPLATE_ID, { draftVersionId: 'new-draft' });
    state.fixture.destroy();
  });
});
