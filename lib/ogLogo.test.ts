// Futtatás: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Az OG-kép (app/[slug]/opengraph-image.tsx) ezt a fájlt olvassa futásidőben; a Satori csak PNG-t tud.
test('az OG-kép logója valódi PNG, 180×60', () => {
  const fajl = readFileSync('public/brand/ZynAI_logo_light.png');
  assert.deepEqual([...fajl.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 'PNG-aláírás');
  assert.equal(fajl.readUInt32BE(16), 180, 'szélesség');
  assert.equal(fajl.readUInt32BE(20), 60, 'magasság');
});
