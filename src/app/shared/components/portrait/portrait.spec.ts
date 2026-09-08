import { TestBed } from '@angular/core/testing';
import { SfPortrait } from './portrait';

describe('Therapist portraits', () => {
  it('shows initials for missing photos and recovers from a broken image', () => {
    const fixture = TestBed.createComponent(SfPortrait);
    fixture.componentRef.setInput('initial', 'AM');
    fixture.componentRef.setInput('alt', 'Alex Morgan');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('AM');
    fixture.componentRef.setInput('src', '/missing-portrait.png');
    fixture.detectChanges();
    const image = fixture.nativeElement.querySelector('img');
    expect(image.alt).toBe('Alex Morgan');
    image.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.textContent.trim()).toBe('AM');
    fixture.componentRef.setInput('src', '/replacement-portrait.png');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe(
      '/replacement-portrait.png',
    );
  });
});
