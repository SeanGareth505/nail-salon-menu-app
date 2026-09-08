#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../public/assets/lottie/categories');
mkdirSync(outDir, { recursive: true });

const FOREST = [0.4352941176, 0.5607843137, 0.4784313725, 1];
const CHAMPAGNE = [0.7607843137, 0.6588235294, 0.5333333333, 1];
const SAGE = [0.6392156863, 0.7254901961, 0.6705882353, 1];

function shapeLayer(name, shapes, index) {
  return {
    ddd: 0,
    ind: index,
    ty: 4,
    nm: name,
    sr: 1,
    ks: {
      o: { a: 0, k: 100 },
      r: { a: 0, k: 0 },
      p: { a: 0, k: [60, 60, 0] },
      a: { a: 0, k: [0, 0, 0] },
      s: {
        a: 1,
        k: [
          { i: { x: [0.42, 0.42, 0.42], y: [1, 1, 1] }, o: { x: [0.58, 0.58, 0.58], y: [0, 0, 0] }, t: 40, s: [100, 100, 100] },
          { i: { x: [0.42, 0.42, 0.42], y: [1, 1, 1] }, o: { x: [0.58, 0.58, 0.58], y: [0, 0, 0] }, t: 70, s: [106, 106, 100] },
          { t: 100, s: [100, 100, 100] },
        ],
      },
    },
    ao: 0,
    shapes,
    ip: 0,
    op: 100,
    st: 0,
    bm: 0,
  };
}

function strokeGroup(items, color, width = 3, offset = [0, 0]) {
  return {
    ty: 'gr',
    it: [
      ...items,
      {
        ty: 'st',
        c: { a: 0, k: color },
        o: { a: 0, k: 100 },
        w: { a: 0, k: width },
        lc: 2,
        lj: 2,
        nm: 'Stroke',
      },
      {
        ty: 'tr',
        p: { a: 0, k: offset },
        a: { a: 0, k: [0, 0] },
        s: { a: 0, k: [100, 100] },
        r: { a: 0, k: 0 },
        o: { a: 0, k: 100 },
        sk: { a: 0, k: 0 },
        sa: { a: 0, k: 0 },
        nm: 'Transform',
      },
    ],
    nm: 'Group',
  };
}

function pathShape(path) {
  return {
    ty: 'sh',
    ks: {
      a: 0,
      k: {
        i: path.i,
        o: path.o,
        v: path.v,
        c: path.c ?? false,
      },
    },
    nm: 'Path',
  };
}

function ellipseShape(size) {
  return {
    d: 1,
    ty: 'el',
    s: { a: 0, k: [size, size] },
    p: { a: 0, k: [0, 0] },
    nm: 'Ellipse',
  };
}

const CATEGORIES = {
  nail: {
    color: FOREST,
    groups: [
      {
        items: [
          pathShape({
            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
            v: [[-11, -30], [11, -30], [11, -20], [9, 30], [-9, 30], [-11, -20]],
            c: false,
          }),
          pathShape({
            i: [[0, 0], [0, 0]],
            o: [[0, 0], [0, 0]],
            v: [[-8, -8], [8, -8]],
            c: false,
          }),
        ],
      },
    ],
  },
  facial: {
    color: SAGE,
    groups: [
      { items: [ellipseShape(58)] },
      {
        items: [
          pathShape({
            i: [[0, 0], [0, 0], [0, 0]],
            o: [[0, 0], [0, 0], [0, 0]],
            v: [[-16, 12], [0, 24], [16, 12]],
            c: false,
          }),
        ],
      },
      { items: [ellipseShape(6)], width: 2.8, offset: [-12, -8] },
      { items: [ellipseShape(6)], width: 2.8, offset: [12, -8] },
    ],
  },
  massage: {
    color: FOREST,
    groups: [
      {
        items: [
          pathShape({
            i: [[0, 0], [0, 0], [0, 0]],
            o: [[0, 0], [0, 0], [0, 0]],
            v: [[-24, 4], [-24, -16], [-8, -16]],
            c: false,
          }),
          pathShape({
            i: [[0, 0], [0, 0], [0, 0]],
            o: [[0, 0], [0, 0], [0, 0]],
            v: [[-4, 18], [-4, -18], [10, -18]],
            c: false,
          }),
          pathShape({
            i: [[0, 0], [0, 0], [0, 0]],
            o: [[0, 0], [0, 0], [0, 0]],
            v: [[16, 18], [16, -6], [30, -6]],
            c: false,
          }),
        ],
      },
    ],
  },
  waxing: {
    color: CHAMPAGNE,
    groups: [
      {
        items: [
          pathShape({
            i: [[0, 0], [0, 0], [0, 0]],
            o: [[0, 0], [0, 0], [0, 0]],
            v: [[-28, 28], [0, 0], [28, -28]],
            c: false,
          }),
          pathShape({
            i: [[0, 0], [0, 0]],
            o: [[0, 0], [0, 0]],
            v: [[-28, 28], [-18, 20]],
            c: false,
          }),
        ],
      },
    ],
  },
  lashes: {
    color: FOREST,
    groups: [
      {
        items: [
          pathShape({
            i: [[0, 0], [0, 0], [0, 0]],
            o: [[0, 0], [0, 0], [0, 0]],
            v: [[-30, -4], [0, -18], [30, -4]],
            c: false,
          }),
          pathShape({
            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
            v: [[-18, -10], [-14, -22], [-10, -10], [-6, -22], [-2, -10]],
            c: false,
          }),
          pathShape({
            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
            v: [[2, -10], [6, -22], [10, -10], [14, -22], [18, -10]],
            c: false,
          }),
        ],
      },
    ],
  },
  spa: {
    color: CHAMPAGNE,
    groups: [
      {
        items: [
          pathShape({
            i: [[0, 0], [0, 0], [0, 0], [0, 0]],
            o: [[0, 0], [0, 0], [0, 0], [0, 0]],
            v: [[0, -30], [8, -8], [30, 0], [8, 8], [0, 30], [-8, 8], [-30, 0], [-8, -8]],
            c: true,
          }),
          pathShape({
            i: [[0, 0], [0, 0]],
            o: [[0, 0], [0, 0]],
            v: [[-20, 26], [20, 26]],
            c: false,
          }),
        ],
      },
    ],
  },
  star: {
    color: CHAMPAGNE,
    groups: [
      {
        items: [
          pathShape({
            i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
            o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
            v: [[0, -28], [8, -6], [30, -2], [12, 14], [18, 34], [0, 22], [-18, 34], [-12, 14], [-30, -2], [-8, -6]],
            c: true,
          }),
        ],
      },
    ],
  },
  leaf: {
    color: SAGE,
    groups: [
      {
        items: [
          pathShape({
            i: [[0, 0], [0, 0], [0, 0]],
            o: [[0, 0], [0, 0], [0, 0]],
            v: [[-24, 26], [0, -30], [24, 26]],
            c: false,
          }),
          pathShape({
            i: [[0, 0], [0, 0]],
            o: [[0, 0], [0, 0]],
            v: [[-24, 26], [0, -2]],
            c: false,
          }),
        ],
      },
    ],
  },
};

for (const [key, spec] of Object.entries(CATEGORIES)) {
  const shapes = spec.groups.map((group) =>
    strokeGroup(group.items, spec.color, group.width, group.offset),
  );

  const data = {
    v: '5.7.5',
    fr: 60,
    ip: 0,
    op: 100,
    w: 120,
    h: 120,
    nm: `SalonFlow ${key}`,
    ddd: 0,
    assets: [],
    layers: [shapeLayer(key, shapes, 1)],
  };

  const file = join(outDir, `${key}.json`);
  writeFileSync(file, JSON.stringify(data));
  console.log('Wrote', file);
}
