import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Single-weight 1.5px line icon set, matching the approved SalonFlow design
 * language (no filled shapes). Small, self-contained subset of the
 * feather-icons path set (MIT) — add new names here rather than pulling in
 * an icon font/library.
 */
const ICONS: Record<string, string> = {
  home: 'M3 11.5 12 4l9 7.5 M5.5 10v9.5h13V10 M9.5 19.5V13.5h5v6',
  treatments: 'M12 3c2.5 2.7 4 5 4 7.3a4 4 0 1 1-8 0C8 8 9.5 5.7 12 3Z',
  specials: 'M20.5 12.3 12.7 20a1 1 0 0 1-1.4 0l-7.3-7.3a1 1 0 0 1-.3-.7V5.5A1.5 1.5 0 0 1 5.5 4H12a1 1 0 0 1 .7.3l7.8 7.8a1 1 0 0 1 0 1.4Z M8.5 8.5h.01',
  team: 'M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M3.5 20v-1.5A3.5 3.5 0 0 1 7 15h3a3.5 3.5 0 0 1 3.5 3.5V20 M16 6.2a3 3 0 0 1 0 5.6 M18.5 15.3a3.5 3.5 0 0 1 2 3.2V20',
  contact: 'M4.5 4.5h3l2 5-2.3 1.4a11 11 0 0 0 5.4 5.4l1.4-2.3 5 2v3a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3 6.1 1.5 1.5 0 0 1 4.5 4.5Z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z M20.5 20.5 16 16',
  filter: 'M4 6h16 M8 12h8 M11 18h2',
  'chevron-left': 'm14.5 5-7 7 7 7',
  'chevron-right': 'm9.5 5 7 7-7 7',
  'arrow-right': 'M4.5 12h15 M13.5 5.5 20 12l-6.5 6.5',
  check: 'm5 12.5 5 5L20 7',
  close: 'm6 6 12 12M18 6 6 18',
  calendar: 'M4.5 8h15M7 4.5v3M17 4.5v3M5.5 6h13A1.5 1.5 0 0 1 20 7.5v11A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6Z',
  clients: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M3.5 20v-1a4.5 4.5 0 0 1 4.5-4.5h2A4.5 4.5 0 0 1 14.5 19v1 M16 4.3a3.5 3.5 0 0 1 0 6.4 M18 14.7a4.5 4.5 0 0 1 2.5 4v1.3',
  records: 'M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20V4a.5.5 0 0 1 .5-.5Z M14 3.5V8h4.2 M9 13h6M9 16.5h6',
  pen: 'M4 20l1-4.2L15.8 5A2 2 0 0 1 18.6 5l.4.4A2 2 0 0 1 19 8.2L8.2 19 4 20Z',
  phone: 'M4.5 4.5h3l2 5-2.3 1.4a11 11 0 0 0 5.4 5.4l1.4-2.3 5 2v3a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3 6.1 1.5 1.5 0 0 1 4.5 4.5Z',
  whatsapp: 'M7 17.3 4.5 19.5l.9-3.2A7.5 7.5 0 1 1 8.7 19l-1.7-1.7Z M9 10c0 2.5 2.5 5 5 5 .3 0 .8-.5.8-1s-1.5-1.7-1.8-1.7-.5.5-.8.5c-.4 0-2-1-2-2.7 0-.3.5-.5.5-.8s-.7-1.8-1.2-1.8-.5.5-.5 1.5Z',
  'map-pin': 'M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21Z M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  mail: 'M4.5 6h15A1 1 0 0 1 20.5 7v10a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z M4.8 6.8l7.2 6 7.2-6',
  star: 'm12 4 2.3 5.3 5.7.5-4.3 3.8 1.3 5.6L12 16.3 6.9 19.2l1.3-5.6-4.3-3.8 5.7-.5Z',
  warning: 'M12 4 21 19.5H3L12 4Z M12 10v4M12 17h.01',
  clock: 'M12 6.5V12l3.5 2 M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  droplet: 'M12 3c2.5 2.7 6 6.6 6 10.3a6 6 0 1 1-12 0C6 9.6 9.5 5.7 12 3Z',
  nail: 'M9.5 4h5v2.5H16l-.8 13.5h-6.4L8 6.5h1.5V4z M10.5 9h3',
  facial: 'M12 4.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15z M9.5 11h.01M14.5 11h.01M9 14.8a3.8 3.8 0 0 0 6 0',
  massage: 'M7.5 11.5V9a2.2 2.2 0 1 1 4.4 0v7.2M14.8 10.2V8a2.2 2.2 0 1 1 4.4 0v9',
  waxing: 'M5 19c5.5-7.5 10.5-11.5 16.5-15M5 19l3-2.5M18.5 4l2.5 2',
  lashes: 'M2.5 12.2S6.2 7.5 12 7.5s9.5 4.7 9.5 4.7-3.7 4.8-9.5 4.8S2.5 12.2 2.5 12.2z M12 14.8a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z M8 6.5l1 1.5M12 5.5v2M16 6.5l-1 1.5',
  spa: 'M12 3.5l1.4 4.8L18 9.5l-4.6 1.3L12 15.2l-1.4-4.4L6 9.5l4.6-1.2L12 3.5z M5 19.5h14',
  sparkle: 'M12 3l1.2 4.4L17.5 8.5 13 10l-1 4.5-1-4.5L6.5 8.5l4.3-1.1L12 3z M18.5 14.5l.9 3.1 3.1.9-3.1.9-.9 3.1-.9-3.1-3.1-.9 3.1-.9.9-3.1z',
  flower: 'M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z M12 4.5v2.5M12 17v2.5M4.5 12H7M17 12h2.5M6.4 6.4l1.8 1.8M15.8 15.8l1.8 1.8M6.4 17.6l1.8-1.8M15.8 8.2l1.8-1.8',
  'hand-care': 'M8.5 14.5V9a1.2 1.2 0 0 1 2.4 0v5.5M10.9 14.5V8a1.2 1.2 0 0 1 2.4 0v6.5M13.3 14.5v-3a1.2 1.2 0 0 1 2.4 0V15a3.2 3.2 0 0 1-3.2 3.2H9.8A3.8 3.8 0 0 1 6 14.4v-2.2a1.2 1.2 0 0 1 2.4 0v2.3',
  brush: 'M15.5 4.5l4 4-9.5 9.5H6v-4l9.5-9.5z M14 6l4 4',
  feather: 'M4.5 19.5c5.5-7 9.5-10.5 15-14.5 0 3.5-1.5 7-4.5 10s-6.5 6-10.5 4.5z M8.5 15.5l3.5 3.5',
  wand: 'M6.5 17.5 15.5 8.5M15.5 8.5l2-2M15.5 8.5l-2 2M17.5 6.5l2 2',
  lotus: 'M12 13.5c-2.8 0-5-1.8-6-4.5 1.8.4 3.4-.2 6-2.3 2.6 2.1 4.2 2.7 6 2.3-1 2.7-3.2 4.5-6 4.5z M12 13.5V18.5',
  leaf: 'M5 19c8 0 14-6 14-14 0 0-9 0-13 4S5 19 5 19Z M5 19c2-4 4.5-6.5 8-8.5',
  scissors: 'M6.5 8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z M6.5 20.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z M20 5 8.3 15 M20 20 8.3 10',
  sliders: 'M4 5h9M17 5h3M4 12h3M9 12h11M4 19h13M19 19h1',
  logout: 'M9 20H5.5A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4H9 M15 16l4-4-4-4 M19 12H9',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  'eye-off': 'M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M6.12 6.12A13.8 13.8 0 0 0 2 12s4 8 10 8a9.7 9.7 0 0 0 4.11-.94M2 2l20 20',
  camera: 'M4 8h3.2L9 5.5h6L16.8 8H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  qr: 'M4 4h6v6H4V4Z M14 4h6v6h-6V4Z M4 14h6v6H4v-6Z M15 15h2v2h-2zM19 15h1.5v1.5H19zM15 19h1.5v1.5H15zM18.5 18.5h2v2h-2z',
  refresh: 'M20 11A8 8 0 1 0 18.5 16 M20 11V6M20 11h-5',
  building: 'M5 20V5.5A1.5 1.5 0 0 1 6.5 4h11A1.5 1.5 0 0 1 19 5.5V20 M2.5 20h19M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1',
  grid: 'M3.5 3.5h7v7h-7z M13.5 3.5h7v7h-7z M3.5 13.5h7v7h-7z M13.5 13.5h7v7h-7z',
  bell: 'M18 8.5a6 6 0 1 0-12 0c0 6.5-2.5 8-2.5 8h17S18 15 18 8.5 M13.7 20.2a2 2 0 0 1-3.4 0',
  shield: 'M12 3 19.5 6v6c0 4.4-3.1 7.6-7.5 9-4.4-1.4-7.5-4.6-7.5-9V6Z M9 12.2l2 2 4-4',
  chart: 'M4 20V10 M9.5 20V4 M15 20v-7 M20.5 20V7',
  menu: 'M4 7h16 M4 12h16 M4 17h16',
  folder: 'M4 6.5A1.5 1.5 0 0 1 5.5 5h4l2 2.5h7A1.5 1.5 0 0 1 20 9v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18Z',
  clipboard:
    'M9 3.5h6a1 1 0 0 1 1 1v1.2H8V4.5a1 1 0 0 1 1-1Z M16 5.7h2.5a1.5 1.5 0 0 1 1.5 1.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19V7.2a1.5 1.5 0 0 1 1.5-1.5H8 M8 11h8 M8 15h5',
  doccheck:
    'M14 3.5H6.5A1.5 1.5 0 0 0 5 5v14a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V8.5Z M14 3.5V8.5h5 M8.5 14.5l2 2 4-4',
  user: 'M19 20.5v-1.8a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v1.8 M12 10.7a3.9 3.9 0 1 0 0-7.7 3.9 3.9 0 0 0 0 7.7',
};

@Component({
  selector: 'sf-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      [attr.stroke]="'currentColor'"
      [attr.stroke-width]="strokeWidth()"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path [attr.d]="path()" />
    </svg>
  `,
  styles: [
    `:host { display: inline-flex; align-items: center; justify-content: center; line-height: 0; color: inherit; }`,
  ],
})
export class SfIcon {
  readonly name = input.required<string>();
  readonly size = input<number>(20);
  readonly strokeWidth = input<number>(1.6);

  path(): string {
    return ICONS[this.name()] ?? ICONS['close'];
  }
}
