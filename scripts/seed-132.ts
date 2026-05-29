#!/usr/bin/env node
/**
 * Seed 132 new gated articles from data/seed-queue-final.json.
 * Uses Claude via generateWithRetry. Pushes each to Bunny on success.
 * Articles are saved as gated (published: false).
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { generateWithRetry } from "../src/lib/generator.ts";

const ART_DIR = path.resolve(process.cwd(), "data", "articles");
const BUNNY_HOST = "https://ny.storage.bunnycdn.com";
const ZONE = "anger-practice";
const STORAGE_KEY = process.env.BUNNY_STORAGE_KEY || "f5c045db-2822-4ad7-98ccba130603-6024-44fc";
const PUSH = process.env.PUSH_BUNNY !== "0";
const CONC = Number(process.env.CONCURRENCY || 4);

const queue: string[] = JSON.parse(fs.readFileSync("data/seed-queue-final.json", "utf8"));
console.log(`[seed-132] ${queue.length} topics | conc=${CONC} | push=${PUSH}`);

async function bunnyPut(slug: string, body: string) {
  const url = `${BUNNY_HOST}/${ZONE}/articles/${slug}.json`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { AccessKey: STORAGE_KEY, "Content-Type": "application/json" },
    body,
  });
  if (!res.ok) throw new Error(`PUT failed ${res.status}: ${await res.text()}`);
}

let cursor = 0;
let ok = 0;
let fail = 0;

async function worker(id: number) {
  while (cursor < queue.length) {
    const i = cursor++;
    const topic = queue[i];
    const tag = `[${i + 1}/${queue.length}]`;
    try {
      const a = await generateWithRetry(topic, 5);
      // Save as gated
      const now = new Date().toISOString();
      const article = {
        ...a,
        published: false,
        publishedAt: null,
        createdAt: now,
        scheduledFor: now, // will be promoted by cron in FIFO order
      };
      const json = JSON.stringify(article, null, 2);
      fs.mkdirSync(ART_DIR, { recursive: true });
      fs.writeFileSync(path.join(ART_DIR, `${a.slug}.json`), json);
      if (PUSH) await bunnyPut(a.slug, json);
      ok++;
      console.log(`${tag} OK ${a.slug} ${a.wordCount}w v=${a.voiceScore}`);
    } catch (e: any) {
      fail++;
      console.error(`${tag} FAIL ${topic.slice(0, 60)}: ${e.message}`);
    }
  }
}

await Promise.all(Array.from({ length: CONC }, (_, i) => worker(i)));
console.log(`[seed-132] DONE ok=${ok} failed=${fail}`);
