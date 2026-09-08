import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { expandCollapse } from '../../animations/motion.animations';

@Component({
  selector: 'sf-signature-pad',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [expandCollapse],
  template: `
    <div class="pad-shell sf-motion-scale-in">
      <div class="pad-wrap">
        <canvas
          #canvas
          (pointerdown)="start($event)"
          (pointermove)="move($event)"
          (pointerup)="end()"
          (pointercancel)="cancel()"
        ></canvas>
        @if (empty) {
          <span class="placeholder">Sign here</span>
        }
      </div>
      <div class="controls">
        <button type="button" class="ghost" (click)="undo()" [disabled]="!canUndo">Undo</button>
        <button type="button" class="ghost" (click)="clear()">Clear</button>
        @if (confirmed()) {
          <span class="status">Signature captured</span>
        }
      </div>
    </div>
  `,
  styles: [`
    .pad-shell { display: flex; flex-direction: column; gap: var(--sf-space-3); }
    .pad-wrap { position: relative; border: 1.5px solid var(--sf-border-strong); border-radius: 14px; background: var(--sf-surface); touch-action: none; overflow: hidden; }
    canvas { display: block; width: 100%; height: 240px; touch-action: none; cursor: crosshair; }
    .placeholder { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--sf-ink-muted); pointer-events: none; font-family: var(--sf-font-display); font-size: 1.05rem; }
    .controls { display: flex; align-items: center; gap: var(--sf-space-2); flex-wrap: wrap; }
    .status {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 48px;
      padding: 0 4px;
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--sf-forest);
    }
    .status::before {
      content: '✓';
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--sf-sage-light);
      color: var(--sf-forest);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.72rem;
    }
    button {
      border-radius: var(--sf-radius-pill);
      padding: 12px 20px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      border: 1.5px solid var(--sf-border-strong);
      background: var(--sf-surface);
      color: var(--sf-ink);
      min-height: 48px;
    }
  `],
})
export class SfSignaturePad implements AfterViewInit {
  initialSignature = input<string | null>(null);
  readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  readonly signatureChange = output<string | null>();

  empty = true;
  readonly confirmed = signal(false);
  private ctx!: CanvasRenderingContext2D;
  private drawing = false;
  private baseline: HTMLImageElement | null = null;
  private baselineDataUrl: string | null = null;
  private strokes: { x: number; y: number }[][] = [];

  constructor() {
    effect(() => {
      if (this.initialSignature() === null && this.ctx) this.clear();
    });
  }

  get canUndo(): boolean {
    return this.strokes.length > 0;
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef().nativeElement;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(ratio, ratio);
    ctx.strokeStyle = '#262620';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    this.ctx = ctx;
    this.restoreInitialSignature();
  }

  private restoreInitialSignature(): void {
    const dataUrl = this.initialSignature();
    if (!dataUrl) return;

    const img = new Image();
    img.onload = () => {
      if (this.initialSignature() !== dataUrl) return;
      const canvas = this.canvasRef().nativeElement;
      const rect = canvas.getBoundingClientRect();
      this.baseline = img;
      this.baselineDataUrl = dataUrl;
      this.ctx.drawImage(img, 0, 0, rect.width, rect.height);
      this.empty = false;
      this.confirmed.set(true);
      this.signatureChange.emit(dataUrl);
    };
    img.src = dataUrl;
  }

  start(ev: PointerEvent): void {
    if (ev.button !== 0) return;
    this.canvasRef().nativeElement.setPointerCapture(ev.pointerId);
    this.drawing = true;
    this.empty = false;
    this.confirmed.set(false);
    const point = this.point(ev);
    this.strokes.push([point]);
    this.ctx.beginPath();
    this.ctx.moveTo(point.x, point.y);
  }

  move(ev: PointerEvent): void {
    if (!this.drawing) return;
    const point = this.point(ev);
    this.strokes[this.strokes.length - 1].push(point);
    this.ctx.lineTo(point.x, point.y);
    this.ctx.stroke();
  }

  end(): void {
    if (!this.drawing) return;
    this.drawing = false;
    const stroke = this.strokes[this.strokes.length - 1];
    if (!stroke || !stroke.some((point) => Math.hypot(point.x - stroke[0].x, point.y - stroke[0].y) >= 3)) this.strokes.pop();
    this.redraw();
    this.confirmed.set(this.baseline !== null || this.strokes.length > 0);
    this.emitCurrent();
  }

  cancel(): void {
    if (!this.drawing) return;
    this.drawing = false;
    this.strokes.pop();
    this.redraw();
    this.confirmed.set(this.baseline !== null || this.strokes.length > 0);
    this.emitCurrent();
  }

  undo(): void {
    this.strokes.pop();
    this.redraw();
    this.confirmed.set(this.baseline !== null || this.strokes.length > 0);
    this.emitCurrent();
  }

  clear(): void {
    this.baseline = null;
    this.baselineDataUrl = null;
    this.strokes = [];
    this.redraw();
    this.empty = true;
    this.confirmed.set(false);
    this.signatureChange.emit(null);
  }

  private redraw(): void {
    const canvas = this.canvasRef().nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (this.baseline) {
      const rect = canvas.getBoundingClientRect();
      this.ctx.drawImage(this.baseline, 0, 0, rect.width, rect.height);
    }
    for (const stroke of this.strokes) {
      if (stroke.length === 0) continue;
      this.ctx.beginPath();
      this.ctx.moveTo(stroke[0].x, stroke[0].y);
      for (const pt of stroke.slice(1)) this.ctx.lineTo(pt.x, pt.y);
      this.ctx.stroke();
    }
    this.empty = this.strokes.length === 0 && this.baseline === null;
  }

  private emitCurrent(): void {
    if (this.strokes.length === 0 && this.baselineDataUrl) {
      this.signatureChange.emit(this.baselineDataUrl);
      return;
    }
    if (this.strokes.length === 0 || !this.confirmed()) {
      this.signatureChange.emit(null);
      return;
    }
    const canvas = this.canvasRef().nativeElement;
    this.signatureChange.emit(canvas.toDataURL('image/png'));
  }

  private point(ev: PointerEvent): { x: number; y: number } {
    const canvas = this.canvasRef().nativeElement;
    const rect = canvas.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  }
}
