import { TestBed } from '@angular/core/testing';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { Subject } from 'rxjs';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let events: Subject<unknown>;
  let service: LoadingService;

  beforeEach(() => {
    events = new Subject();
    TestBed.configureTestingModule({ providers: [{ provide: Router, useValue: { events } }] });
    service = TestBed.inject(LoadingService);
  });

  it('keeps navigation progress separate from saving operations', () => {
    service.begin('Saving changes');
    events.next(new NavigationStart(1, '/treatments'));
    expect(service.navigating()).toBeTrue();
    expect(service.message()).toBe('Saving changes');
    events.next(new NavigationEnd(1, '/treatments', '/treatments'));
    expect(service.navigating()).toBeFalse();
    expect(service.active()).toBeTrue();
    service.end();
    expect(service.active()).toBeFalse();
  });

  it('clears progress for cancelled and failed navigation', () => {
    events.next(new NavigationStart(1, '/admin'));
    events.next(new NavigationCancel(1, '/admin', 'Sign in required'));
    expect(service.navigating()).toBeFalse();
    events.next(new NavigationStart(2, '/treatments'));
    events.next(new NavigationError(2, '/treatments', new Error('Unavailable')));
    expect(service.navigating()).toBeFalse();
  });

  it('waits for every concurrent operation and tolerates extra end calls', () => {
    service.begin();
    service.begin();
    service.end();
    expect(service.active()).toBeTrue();
    service.end();
    service.end();
    expect(service.active()).toBeFalse();
    service.begin();
    expect(service.active()).toBeTrue();
  });

  it('releases the operation overlay when an operation rejects', async () => {
    await expectAsync(
      service.run(async () => {
        throw new Error('Save failed');
      }),
    ).toBeRejectedWithError('Save failed');
    expect(service.active()).toBeFalse();
  });
});
