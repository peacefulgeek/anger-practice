// Reschedules gated drafts (published !== true) so they release one per Mon-Sat
// at 09:00 PT, starting tomorrow. Pushes every changed file back to Bunny.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ART_DIR = '/home/ubuntu/anger-practice/data/articles';
const BUNNY_HOST = 'https://ny.storage.bunnycdn.com';
const BUNNY_ZONE = 'anger-practice';
const BUNNY_KEY = 'f5c045db-2822-4ad7-98ccba130603-6024-44fc';

const files = readdirSync(ART_DIR).filter((f) => f.endsWith('.json'));
const arts = files.map((f) => ({ file: f, ...JSON.parse(readFileSync(join(ART_DIR, f), 'utf8')) }));

// Gated = not published yet, has scheduledFor, has body
const gated = arts.filter((a) => a.published !== true);
console.log(`Found ${gated.length} gated drafts to reschedule`);

// Sort by current scheduledFor (chronological order preserved)
gated.sort((a, b) => {
  const ta = a.scheduledFor ? new Date(a.scheduledFor).getTime() : 0;
  const tb = b.scheduledFor ? new Date(b.scheduledFor).getTime() : 0;
  return ta - tb;
});

// Build the schedule list: starting tomorrow (in PT, 09:00), Mon-Sat only
function nextSlots(count) {
  const slots = [];
  // Start at tomorrow 09:00 PT. PT is UTC-8 in winter, UTC-7 in summer.
  // Today is 2026-05-27 — that's PDT (UTC-7), so 09:00 PT = 16:00 UTC.
  const now = new Date();
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 16, 0, 0));
  while (slots.length < count) {
    const d = cursor.getUTCDay(); // 0=Sun, 1=Mon..6=Sat
    if (d !== 0) slots.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return slots;
}

const slots = nextSlots(gated.length);

let changed = 0;
let pushFailed = 0;

async function pushOne(art) {
  const bunnyUrl = `${BUNNY_HOST}/${BUNNY_ZONE}/articles/${art.file}`;
  const body = { ...art };
  delete body.file;
  const r = await fetch(bunnyUrl, {
    method: 'PUT',
    headers: { 'AccessKey': BUNNY_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body, null, 2),
  });
  if (!r.ok) {
    console.error(`PUSH FAIL ${art.file}: ${r.status} ${await r.text()}`);
    pushFailed++;
    return false;
  }
  return true;
}

const CONC = 6;
let cursor = 0;
async function worker() {
  while (cursor < gated.length) {
    const i = cursor++;
    const art = gated[i];
    art.scheduledFor = slots[i].toISOString();
    const localPath = join(ART_DIR, art.file);
    const toWrite = { ...art };
    delete toWrite.file;
    writeFileSync(localPath, JSON.stringify(toWrite, null, 2));
    if (await pushOne(art)) changed++;
    if (changed % 10 === 0) console.log(`  rescheduled: ${changed}/${gated.length} (next: ${art.slug} → ${art.scheduledFor})`);
  }
}
await Promise.all(Array.from({ length: CONC }, worker));

console.log(`\nRescheduled ${changed}/${gated.length}`);
console.log(`First slot: ${slots[0]?.toISOString()}`);
console.log(`Last slot: ${slots[slots.length - 1]?.toISOString()}`);
console.log(`Push failures: ${pushFailed}`);
process.exit(pushFailed === 0 ? 0 : 1);
