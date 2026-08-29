import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
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
          (pointerleave)="end()"
        ></canvas>
        @if (empty) {
          <span class="placeholder">Sign here</span>
        }
      </div>
      <div class="controls">
        <button type="button" class="ghost" (click)="undo()" [disabled]="empty">Undo</button>
        <button type="button" class="ghost" (click)="clear()">Clear</button>
        <button type="button" class="confirm" [class.confirmed]="confirmed()" [disabled]="empty" (click)="confirm()">
          @if (confirmed()) { <span class="check">✓</span> Confirmed }
          @else { Confirm signature }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .pad-shell { display: flex; flex-direction: column; gap: var(--sf-space-3); }
    .pad-wrap { position: relative; border: 1.5px dashed var(--sf-border); border-radius: var(--sf-radius-md); background: #fff; touch-action: none; }
    canvas { display: block; width: 100%; height: 220px; touch-action: none; cursor: crosshair; }
    .placeholder { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--sf-ink-muted); pointer-events: none; font-size: 0.9rem; }
    .controls { display: flex; gap: var(--sf-space-2); flex-wrap: wrap; }
    button {
      border-radius: var(--sf-radius-pill);
      padding: 12px 18px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      border: 1.5px solid var(--sf-border);
      background: var(--sf-surface);
      color: var(--sf-ink);
      min-height: 44px;
    }
    .confirm {
      margin-left: auto;
      background: var(--sf-forest);
      color: #fff;
      border-color: var(--sf-forest);
      transition: background-color var(--sf-dur-fast) var(--sf-ease-standard), transform var(--sf-dur-fast) var(--sf-ease-standard);
    }
    .confirm.confirmed { background: var(--sf-sage); border-color: var(--sf-sage); }
    .confirm:disabled { opacity: 0.45; cursor: not-allowed; }
    .check { margin-right: 6px; }
  `],
})
export class SfSignaturePad implements AfterViewInit {
  readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  readonly signatureChange = output<string | null>();

  empty = true;
  readonly confirmed = signal(false);
  private ctx!: CanvasRenderingContext2D;
  private drawing = false;
  private strokes: { x: number; y: number }[][] = [];

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
  }

  start(ev: PointerEvent): void {
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
    this.emitCurrent();
  }

  undo(): void {
    this.strokes.pop();
    this.redraw();
    this.confirmed.set(false);
    this.emitCurrent();
  }

  clear(): void {
    this.strokes = [];
    this.redraw();
    this.empty = true;
    this.confirmed.set(false);
    this.signatureChange.emit(null);
  }

  confirm(): void {
    if (this.empty) return;
    this.confirmed.set(true);
    this.emitCurrent();
  }

  private redraw(): void {
    const canvas = this.canvasRef().nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of this.strokes) {
      if (stroke.length === 0) continue;
      this.ctx.beginPath();
      this.ctx.moveTo(stroke[0].x, stroke[0].y);
      for (const pt of stroke.slice(1)) this.ctx.lineTo(pt.x, pt.y);
      this.ctx.stroke();
    }
    this.empty = this.strokes.length === 0;
  }

  private emitCurrent(): void {
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
