import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SfDynamicField } from './dynamic-field';

describe('Dynamic consent fields', () => {
  let fixture: ComponentFixture<SfDynamicField>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SfDynamicField, NoopAnimationsModule] });
    fixture = TestBed.createComponent(SfDynamicField);
  });

  it('shows an error when a required acknowledgement is unchecked', () => {
    fixture.componentRef.setInput('field', { key: 'agree', type: 'acknowledgement', label: 'I agree', required: true, step: 'consent', sortOrder: 1 });
    fixture.componentRef.setInput('value', false);
    fixture.componentRef.setInput('showValidation', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input').getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('.sf-field-error').textContent).toContain('Please confirm');
    fixture.componentRef.setInput('value', true);
    fixture.detectChanges();
    expect(fixture.componentInstance.fieldErrorMessage()).toBeNull();
  });

  it('preserves paragraphs in information shown to the client', () => {
    fixture.componentRef.setInput('field', { key: 'legal', type: 'information', label: 'Before you sign', bodyText: 'First paragraph.\n\nSecond paragraph.', required: false, step: 'consent', sortOrder: 1 });
    fixture.detectChanges();
    const body = fixture.nativeElement.querySelector('.body-text');
    expect(body.textContent).toBe('First paragraph.\n\nSecond paragraph.');
    expect(getComputedStyle(body).whiteSpace).toBe('pre-line');
  });

  it('keeps medication answers as choices and leaves detail fields to the template', () => {
    fixture.componentRef.setInput('field', { key: 'medication', type: 'yes_no_unsure', label: 'Taking medication?', required: true, step: 'health', sortOrder: 1 });
    fixture.componentRef.setInput('value', 'yes');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('textarea')).toBeNull();
    expect(fixture.nativeElement.querySelector('button').getAttribute('aria-pressed')).toBe('true');
  });
});
