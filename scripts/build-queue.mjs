#!/usr/bin/env node
// Build a 500-topic editorial queue out of the 30 seeds + permutations.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "..", "data", "topics-queue.json");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const seeds = [
  "Why You Were Taught That Anger Is Wrong (And Why That's Destroying You)",
  "Anger Is a Boundary: What Your Rage Is Actually Protecting",
  "The Somatic Release of Anger: How to Get It Out of Your Body",
  "Suppressed Anger and Disease: What the Research Shows",
  "Women and Rage: Why Society Fears Female Anger",
  "The Difference Between Anger and Aggression (And Why It Matters)",
  "How to Be Angry Without Destroying Your Relationships",
  "Childhood Anger Suppression and Adult Health",
  "The Nervous System of Anger: What's Actually Happening",
  "Anger After Trauma: Why It Surfaces Years Later",
  "The Spiritual Bypassing of 'Just Let It Go'",
  "How to Feel Anger in Your Body: A Practice Guide",
  "Anger and Grief: The Connection Nobody Talks About",
  "The Pillow Scream, the Forest Howl, and Other Rage Practices",
  "Why 'Calm Down' Is the Worst Thing You Can Say",
  "TCM and Anger: Liver Qi Stagnation and Rising Fire",
  "The Anger Inventory: Naming Every Resentment You're Carrying",
  "How to Set Boundaries When You've Been People-Pleasing Your Whole Life",
  "Anger in Meditation: What Happens When Rage Surfaces on the Cushion",
  "The Freeze Response: When Anger Gets Stuck",
  "Passive-Aggressive Behavior as Suppressed Rage",
  "Teaching Children Healthy Anger: What You Never Learned",
  "Anger and the Workplace: Speaking Up Without Blowing Up",
  "The Physical Practice of Rage: Movement, Sound, and Breath",
  "Why Forgiveness Before Anger Is Spiritual Bypassing",
  "Anger Journaling: The Uncensored Page",
  "Ayurvedic Pitta and Anger: Cooling the Fire Without Extinguishing It",
  "The Anger-Shame Cycle: How They Feed Each Other",
  "How to Support a Partner Who Is Learning to Feel Anger",
  "Reclaiming Your Fire: When Anger Becomes Power",
];

const angles = [
  "Part II",
  "A Deeper Look",
  "Further Reflections",
  "The Somatic Angle",
  "The Relational Angle",
  "The Spiritual Angle (Without Bypassing)",
  "What Nobody Tells You",
  "A Practice",
  "The Research",
  "For Women",
  "For Men",
  "For People Who Were Never Allowed",
  "For Long-Term Practitioners",
  "In Marriage",
  "In Parenting",
  "In Friendship",
  "At Work",
  "In Midlife",
  "After Fifty",
];

const out = new Set();
for (const s of seeds) out.add(s);
for (const s of seeds) {
  for (const a of angles) {
    out.add(`${s} — ${a}`);
  }
  if (out.size > 500) break;
}

// fill if under 500
const extra = [
  "The Mythology of the Hero's Anger",
  "Saturn, Mars, and the Rage Archetypes",
  "The Physiology of a Good Cry After a Good Rage",
  "The Difference Between a Tantrum and a Truth",
  "What Your Nervous System Does With a 'Fine'",
  "The Day I Stopped Being Nice",
  "Saying No in a Body That Has Only Known Yes",
  "The Mothers Who Taught Us Not to Yell",
  "The Fathers Who Yelled Enough for Everyone",
  "The Silent Ones: Quiet Rage in Long Marriages",
  "When Your Child's Anger Scares You",
  "When Your Own Anger Scares You",
  "Rage at a Dying World",
  "The Necessary Anger of Caregivers",
  "When You're Angrier Than You've Ever Been",
];
for (const e of extra) {
  if (out.size >= 500) break;
  out.add(e);
}

const list = Array.from(out).slice(0, 500);
fs.writeFileSync(OUT, JSON.stringify(list, null, 2));
console.log(`Wrote ${list.length} topics to ${OUT}`);
