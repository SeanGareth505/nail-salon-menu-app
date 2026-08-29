#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, '../public/assets/lottie/splash.json');

const CHAMPAGNE = [0.7803921569, 0.6274509804, 0.368627451, 1];
const SAGE = [0.5764705882, 0.6705882353, 0.5803921569, 1];
const SAGE_LIGHT = [0.8588235294, 0.9019607843, 0.8588235294, 1];
const FOREST = [0.2431372549, 0.3254901961, 0.2549019608, 1];

function strokeLayer(name, color, width, shapes, index, start = 0) {
  return {
    ddd: 0,
    ind: index,
    ty: 4,
    nm: name,
    sr: 1,
    ks: {
      o: { a: 0, k: 100 },
      r: { a: 0, k: 0 },
      p: { a: 0, k: [100, 100, 0] },
      a: { a: 0, k: [0, 0, 0] },
      s: { a: 0, k: [100, 100, 100] },
    },
    ao: 0,
    shapes,
    ip: start,
    op: 120,
    st: start,
    bm: 0,
  };
}

function circleTrim(strokeColor, strokeWidth, radius, startFrame, duration, rotation = 0) {
  return [
    {
      ty: 'gr',
      it: [
        {
          d: 1,
          ty: 'el',
          s: { a: 0, k: [radius * 2, radius * 2] },
          p: { a: 0, k: [0, 0] },
          nm: 'Ellipse',
        },
        {
          ty: 'tm',
          s: { a: 0, k: 0 },
          e: {
            a: 1,
            k: [
              { i: { x: [0.42], y: [1] }, o: { x: [0.58], y: [0] }, t: startFrame, s: [0] },
              { t: startFrame + duration, s: [100] },
            ],
          },
          o: { a: 0, k: rotation },
          m: 1,
          nm: 'Trim',
        },
        {
          ty: 'st',
          c: { a: 0, k: strokeColor },
          o: { a: 0, k: 100 },
          w: { a: 0, k: strokeWidth },
          lc: 2,
          lj: 2,
          nm: 'Stroke',
        },
        {
          ty: 'tr',
          p: { a: 0, k: [0, 0] },
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
          sk: { a: 0, k: 0 },
          sa: { a: 0, k: 0 },
          nm: 'Transform',
        },
      ],
      nm: 'CircleGroup',
    },
  ];
}

function leafArc(strokeColor, strokeWidth, path, startFrame, delay) {
  return [
    {
      ty: 'gr',
      it: [
        {
          ty: 'sh',
          ks: {
            a: 0,
            k: {
              i: path.i,
              o: path.o,
              v: path.v,
              c: false,
            },
          },
          nm: 'LeafPath',
        },
        {
          ty: 'tm',
          s: { a: 0, k: 0 },
          e: {
            a: 1,
            k: [
              { i: { x: [0.42], y: [1] }, o: { x: [0.58], y: [0] }, t: startFrame + delay, s: [0] },
              { t: startFrame + delay + 28, s: [100] },
            ],
          },
          o: { a: 0, k: 0 },
          m: 1,
          nm: 'Trim',
        },
        {
          ty: 'st',
          c: { a: 0, k: strokeColor },
          o: { a: 0, k: 100 },
          w: { a: 0, k: strokeWidth },
          lc: 2,
          lj: 2,
          nm: 'Stroke',
        },
        {
          ty: 'tr',
          p: { a: 0, k: [0, 0] },
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: path.rotate ?? 0 },
          o: {
            a: 1,
            k: [
              { i: { x: [0.42], y: [1] }, o: { x: [0.58], y: [0] }, t: startFrame + delay, s: [0] },
              { t: startFrame + delay + 12, s: [100] },
              { t: 110, s: [100] },
              { t: 120, s: [70] },
            ],
          },
          sk: { a: 0, k: 0 },
          sa: { a: 0, k: 0 },
          nm: 'Transform',
        },
      ],
      nm: 'LeafGroup',
    },
  ];
}

const leaves = [
  {
    rotate: -35,
    i: [[0, 0], [0, 0], [0, 0]],
    o: [[0, 0], [0, 0], [0, 0]],
    v: [[-8, 42], [-28, 8], [-4, -34]],
  },
  {
    rotate: 35,
    i: [[0, 0], [0, 0], [0, 0]],
    o: [[0, 0], [0, 0], [0, 0]],
    v: [[8, 42], [28, 8], [4, -34]],
  },
  {
    rotate: 145,
    i: [[0, 0], [0, 0], [0, 0]],
    o: [[0, 0], [0, 0], [0, 0]],
    v: [[-8, -42], [-28, -8], [-4, 34]],
  },
  {
    rotate: -145,
    i: [[0, 0], [0, 0], [0, 0]],
    o: [[0, 0], [0, 0], [0, 0]],
    v: [[8, -42], [28, -8], [4, 34]],
  },
];

const data = {
  v: '5.7.5',
  fr: 60,
  ip: 0,
  op: 120,
  w: 200,
  h: 200,
  nm: 'SalonFlow Botanical Loader',
  ddd: 0,
  assets: [],
  layers: [
    strokeLayer('Champagne Ring', CHAMPAGNE, 2.2, circleTrim(CHAMPAGNE, 2.2, 54, 0, 50, -90), 1),
    strokeLayer('Sage Ring', SAGE_LIGHT, 1.4, circleTrim(SAGE_LIGHT, 1.4, 46, 8, 44, 120), 2),
    ...leaves.map((leaf, i) =>
      strokeLayer(`Leaf ${i + 1}`, i % 2 === 0 ? SAGE : FOREST, 2, leafArc(i % 2 === 0 ? SAGE : FOREST, 2, leaf, 10, i * 8), i + 3),
    ),
    strokeLayer('Inner Accent', CHAMPAGNE, 1.2, circleTrim(CHAMPAGNE, 1.2, 18, 20, 36, 40), 7, 20),
  ],
};

writeFileSync(out, JSON.stringify(data));
console.log('Wrote', out, `(${JSON.stringify(data).length} bytes)`);
