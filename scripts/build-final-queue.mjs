#!/usr/bin/env node
/**
 * Build the final seeding queue of 132 fresh topics to reach 500 gated.
 * Sources:
 *   1. Fresh topics from current data/topics-queue.json (49)
 *   2. Fresh topics from build-real-queue.mjs TOPICS array (35 more unique)
 *   3. 48 new hand-crafted titles below
 * Output: data/seed-queue-final.json (132 unique titles not yet articles)
 */
import fs from "node:fs";
import path from "node:path";

const ART_DIR = path.resolve("data/articles");
const files = fs.readdirSync(ART_DIR).filter(f => f.endsWith(".json"));
const existingTitles = new Set();
const existingSlugs = new Set();
for (const f of files) {
  const a = JSON.parse(fs.readFileSync(path.join(ART_DIR, f), "utf8"));
  existingTitles.add(a.title);
  existingSlugs.add(a.slug);
}

function slugify(t) {
  return t.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 80);
}
function isFresh(t) {
  return !existingTitles.has(t) && !existingSlugs.has(slugify(t));
}

// Source 1: current queue
const q = JSON.parse(fs.readFileSync("data/topics-queue.json", "utf8"));
const fromQueue = q.filter(isFresh);

// Source 2: build-real-queue.mjs
const src = fs.readFileSync("scripts/build-real-queue.mjs", "utf8");
const match = src.match(/const TOPICS = \[([\s\S]*?)\];/);
const realTopics = [];
if (match) for (const m of match[1].matchAll(/"([^"]+)"/g)) realTopics.push(m[1]);
const fromReal = realTopics.filter(t => isFresh(t) && !fromQueue.includes(t));

// Source 3: 48 new editorial titles
const NEW_TITLES = [
  "The Anger of Being Misdiagnosed for Years",
  "When Your Partner's Family Refuses to Accept You",
  "Anger at the Algorithm That Decides Your Worth",
  "The Body's Memory of Being Silenced in Childhood",
  "Rage at the Insurance Company That Denied Your Claim",
  "When Your Therapist Gets It Wrong",
  "The Anger of Watching Your Neighborhood Gentrify",
  "Somatic Tremoring: Letting the Shake Complete Itself",
  "Anger at the School System That Failed Your Child",
  "The Quiet Fury of Being Overlooked for Promotion Again",
  "When Your Doctor Dismisses Your Pain",
  "Anger at the Friend Who Chose Your Abuser's Side",
  "The Rage of Caregiving Without Recognition",
  "When Meditation Makes You Angrier",
  "Anger at the God You Were Promised",
  "The Body After Betrayal: Where Trust Lives Physically",
  "When Your Anger Protects Someone Else",
  "The Fury of Being Told to Be Grateful",
  "Anger at the Landlord Who Won't Fix Anything",
  "When Your Childhood Home Is Demolished",
  "The Rage of Being Parentified Too Young",
  "Anger at the Ex Who Rewrote Your History",
  "When Your Body Refuses to Relax",
  "The Anger of Being the Only One Who Remembers",
  "Rage at the System That Makes You Prove Your Disability",
  "When Your Anger Comes Out as Tears",
  "The Fury of Being Talked Over in Every Meeting",
  "Anger at the Fertility Journey Nobody Warned You About",
  "When Your Sibling Gets the Inheritance",
  "The Rage of Being Expected to Forgive Too Soon",
  "Anger at the Church That Covered It Up",
  "When Your Anger Lives in Your Jaw",
  "The Body's Response to Financial Betrayal",
  "Anger at the Country That Won't Protect Its Children",
  "When Your Best Friend Ghosts You Without Explanation",
  "The Rage of Being Told You're Too Sensitive",
  "Anger at the Healthcare System During Pregnancy",
  "When Your Anger Is the Only Honest Thing in the Room",
  "The Fury of Being Gaslit by an Institution",
  "Anger at the Parent Who Never Apologized",
  "When Your Body Keeps Score of Every Small Betrayal",
  "The Rage of Being Competent and Invisible",
  "Anger at the Mentor Who Took Credit for Your Work",
  "When Your Anger Saves Your Marriage",
  "The Body After a Car Accident: Rage at the Other Driver",
  "Anger at the Adoption System and Its Silences",
  "When Your Anger Is Louder Than Your Grief",
  "The Fury of Being the Responsible One Since Age Eight",
];

const fromNew = NEW_TITLES.filter(t => isFresh(t) && !fromQueue.includes(t) && !fromReal.includes(t));

// Combine: take all from queue, fill from real, fill from new
const final = [...fromQueue];
for (const t of fromReal) { if (final.length >= 132) break; final.push(t); }
for (const t of fromNew) { if (final.length >= 132) break; final.push(t); }

console.log(`Queue sources: fromQueue=${fromQueue.length} fromReal=${fromReal.length} fromNew=${fromNew.length}`);
console.log(`Final seed queue: ${final.length} topics`);

fs.writeFileSync("data/seed-queue-final.json", JSON.stringify(final, null, 2));
console.log("Written to data/seed-queue-final.json");
