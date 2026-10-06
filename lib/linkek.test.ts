// Futtatás: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zynaiUrl } from './linkek.ts';

test('zynai.hu link UTM-paraméterekkel', () => {
  assert.equal(
    zynaiUrl('/kapcsolatfelvetel', 'kezdooldal-csapat'),
    'https://zynai.hu/kapcsolatfelvetel?utm_source=ai-munkaprofil&utm_medium=referral&utm_campaign=ai-munkaprofil&utm_content=kezdooldal-csapat',
  );
  assert.equal(
    zynaiUrl('/', 'fejlec'),
    'https://zynai.hu/?utm_source=ai-munkaprofil&utm_medium=referral&utm_campaign=ai-munkaprofil&utm_content=fejlec',
  );
});

test('csak a zynai.hu-ra mutathat (más domain vagy protokoll-relatív útvonal: hiba)', () => {
  for (const ut of ['//masik.hu/x', 'https://masik.hu/', 'http://zynai.hu/']) assert.throws(() => zynaiUrl(ut, 'x'), /Nem zynai\.hu/, ut);
});
