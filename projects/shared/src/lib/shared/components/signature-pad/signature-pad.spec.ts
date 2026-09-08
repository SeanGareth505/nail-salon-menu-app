import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SfSignaturePad } from './signature-pad';

describe('Signature capture', () => {
  let fixture: ComponentFixture<SfSignaturePad>;
  let emitted: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SfSignaturePad, NoopAnimationsModule] });
    fixture = TestBed.createComponent(SfSignaturePad);
    fixture.detectChanges();
    emitted = jasmine.createSpy('signatureChange');
    fixture.componentInstance.signatureChange.subscribe(emitted);
    spyOn(fixture.componentInstance.canvasRef().nativeElement, 'setPointerCapture');
  });

  it('does not accept a tap as a visible signature', () => {
    const pad = fixture.componentInstance;
    pad.start(new PointerEvent('pointerdown', { clientX: 20, clientY: 20, pointerId: 1 }));
    pad.end();
    expect(pad.confirmed()).toBeFalse();
    expect(pad.empty).toBeTrue();
    expect(emitted).toHaveBeenCalledWith(null);
  });

  it('accepts a drawn stroke and clears cancelled input', () => {
    const pad = fixture.componentInstance;
    pad.start(new PointerEvent('pointerdown', { clientX: 20, clientY: 20, pointerId: 1 }));
    pad.move(new PointerEvent('pointermove', { clientX: 55, clientY: 40, pointerId: 1 }));
    pad.end();
    expect(pad.confirmed()).toBeTrue();
    expect(emitted.calls.mostRecent().args[0]).toMatch(/^data:image\/png/);
    pad.clear();
    pad.start(new PointerEvent('pointerdown', { clientX: 20, clientY: 20, pointerId: 1 }));
    pad.move(new PointerEvent('pointermove', { clientX: 55, clientY: 40, pointerId: 1 }));
    pad.cancel();
    expect(pad.confirmed()).toBeFalse();
    expect(emitted.calls.mostRecent().args[0]).toBeNull();
  });
});
