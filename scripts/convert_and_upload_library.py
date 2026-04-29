#!/usr/bin/env python3
"""Convert 40 generated PNGs to webp (quality 80, resized to 1800px wide)
and upload to Bunny CDN storage zone `anger-practice` under /library/lib-XX.webp.
"""
import os, sys, subprocess, pathlib
from PIL import Image

SRC_DIR = pathlib.Path("/home/ubuntu/webdev-static-assets")
OUT_DIR = pathlib.Path("/tmp/ap_library")
OUT_DIR.mkdir(exist_ok=True)

BUNNY_ZONE = "anger-practice"
BUNNY_HOST = "ny.storage.bunnycdn.com"
BUNNY_KEY  = "f5c045db-2822-4ad7-98ccba130603-6024-44fc"

TARGET_W = 1800

def convert(n):
    src = SRC_DIR / f"lib-{n:02d}.png"
    out = OUT_DIR / f"lib-{n:02d}.webp"
    if not src.exists():
        print(f"MISSING {src}")
        return None
    img = Image.open(src).convert("RGB")
    w, h = img.size
    if w > TARGET_W:
        new_h = int(h * TARGET_W / w)
        img = img.resize((TARGET_W, new_h), Image.LANCZOS)
    img.save(out, "WEBP", quality=80, method=6)
    return out

def upload(local: pathlib.Path, remote: str) -> bool:
    url = f"https://{BUNNY_HOST}/{BUNNY_ZONE}/{remote}"
    r = subprocess.run([
        "curl", "--http1.1", "-s", "-w", "\nHTTP:%{http_code}",
        "-X", "PUT", url,
        "-H", f"AccessKey: {BUNNY_KEY}",
        "-H", "Content-Type: image/webp",
        "--data-binary", f"@{local}",
    ], capture_output=True, text=True, timeout=120)
    ok = "HTTP:201" in r.stdout
    print(f"{'OK' if ok else 'FAIL'}  {remote}  size={local.stat().st_size//1024}KB")
    if not ok:
        print(r.stdout[-400:])
        print(r.stderr[-400:])
    return ok

def main():
    ok = 0
    for n in range(1, 41):
        out = convert(n)
        if out is None:
            continue
        if upload(out, f"library/lib-{n:02d}.webp"):
            ok += 1
    print(f"\nUploaded {ok}/40")

if __name__ == "__main__":
    main()
