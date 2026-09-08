import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { ThemeService } from './core/theme/theme.service';
import { SalonTitleService } from './core/services/salon-title.service';
import {
  DEFAULT_MARK_INITIAL,
  DEFAULT_SALON_CITY,
  DEFAULT_SALON_NAME,
  DEFAULT_SALON_SUBTEXT,
  DEFAULT_SALON_TAGLINE,
  SalonIdentityService,
} from './core/services/salon-identity.service';
import { PwaService } from './core/pwa/pwa.service';
import { MotionService } from './core/motion/motion.service';
import { ConnectivityService } from './core/connectivity/connectivity.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: ThemeService, useValue: { init: () => undefined } },
        { provide: SalonTitleService, useValue: { init: () => undefined } },
        {
          provide: SalonIdentityService,
          useValue: {
            name: signal(DEFAULT_SALON_NAME),
            tagline: signal(DEFAULT_SALON_TAGLINE),
            subtext: signal(DEFAULT_SALON_SUBTEXT),
            city: signal(DEFAULT_SALON_CITY),
            logoUrl: signal('/assets/salonflow-logo.png'),
            markInitial: signal(DEFAULT_MARK_INITIAL),
            wordmarkUpper: signal(DEFAULT_SALON_NAME.toUpperCase()),
          },
        },
        { provide: PwaService, useValue: { init: () => undefined, updateAvailable: signal(false), offlineReady: signal(false) } },
        { provide: MotionService, useValue: { init: () => undefined, markReady: () => undefined } },
        { provide: ConnectivityService, useValue: { init: () => undefined, online: signal(true) } },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
