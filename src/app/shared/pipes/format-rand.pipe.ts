import { Pipe, PipeTransform } from '@angular/core';
import { formatRand } from '../../core/utils/format-rand.util';

@Pipe({
  name: 'formatRand',
  standalone: true,
})
export class FormatRandPipe implements PipeTransform {
  transform(amount: number | null | undefined): string {
    if (amount == null) return '';
    return formatRand(amount);
  }
}
