import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { LOTTIE_ASSETS, LottieAssetKey } from './lottie-assets';
import { LottieThemeService } from './lottie-theme.service';

@Injectable({ providedIn: 'root' })
export class LottieLoaderService {
  private readonly http = inject(HttpClient);
  private readonly theme = inject(LottieThemeService);
  private readonly cache = new Map<string, Observable<unknown>>();

  load(asset: LottieAssetKey): Observable<unknown> {
    const path = LOTTIE_ASSETS[asset];
    const cached = this.cache.get(path);
    if (cached) return cached;

    const request$ = this.http.get<unknown>(path).pipe(
      map((data) => this.theme.themedAnimation(data, asset)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.cache.set(path, request$);
    return request$;
  }

  invalidate(): void {
    this.cache.clear();
  }
}
