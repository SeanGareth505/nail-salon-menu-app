import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'public/assets/salonflow-logo.png');
const iconsDir = join(root, 'public/icons');
const faviconPath = join(root, 'public/favicon.ico');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const python = `
from PIL import Image
import struct, io, sys

source = sys.argv[1]
icons_dir = sys.argv[2]
favicon_path = sys.argv[3]
sizes = [int(s) for s in sys.argv[4:]]

img = Image.open(source).convert('RGBA')
w, h = img.size
side = min(w, int(h * 0.52))
left = (w - side) // 2
mark = img.crop((left, 0, left + side, side))

for size in sizes:
    out = mark.resize((size, size), Image.Resampling.LANCZOS)
    out_path = f"{icons_dir}/icon-{size}x{size}.png"
    out.save(out_path, optimize=True)

ico_sizes = [16, 32, 48]
frames = [mark.resize((s, s), Image.Resampling.LANCZOS) for s in ico_sizes]

def write_ico(path, images):
    header = struct.pack('<HHH', 0, 1, len(images))
    offset = 6 + 16 * len(images)
    entries = b''
    blobs = b''
    for im in images:
        w, h = im.size
        rgba = im.convert('RGBA')
        blob = b''
        for y in range(h):
            for x in range(w):
                r, g, b, a = rgba.getpixel((x, y))
                blob += bytes([b, g, r, a])
            pad = (4 - (w * 4) % 4) % 4
            blob += b'\\x00' * pad
        mask = b''
        for y in range(h):
            row = 0
            for x in range(w):
                if rgba.getpixel((x, y))[3] < 128:
                    row |= 1 << (7 - (x % 8))
                if x % 8 == 7 or x == w - 1:
                    mask += struct.pack('<B', row)
                    row = 0
            pad = (4 - ((w + 7) // 8) % 4) % 4
            mask += b'\\x00' * pad
        combined = blob + mask
        entries += struct.pack('<BBBBHHII', w if w < 256 else 0, h if h < 256 else 0, 0, 0, 1, 32, len(combined), offset)
        blobs += combined
        offset += len(combined)
    with open(path, 'wb') as f:
        f.write(header + entries + blobs)

write_ico(favicon_path, frames)
print('generated', len(sizes), 'png icons and favicon.ico')
`;

mkdirSync(iconsDir, { recursive: true });
execFileSync('python3', ['-c', python, source, iconsDir, faviconPath, ...sizes.map(String)], {
  stdio: 'inherit',
});
