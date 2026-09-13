"""Build lightweight web assets from the team's original autumn illustrations.
Usage: python scripts/import-autumn-assets.py (requires Pillow).
Originals remain unchanged. Keep the full soil/root illustration.
"""
from pathlib import Path
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "秋" / "秋"
OUTPUT = ROOT / "public" / "assets" / "farm"
FAMILIES = {"小白菜": "cabbage", "樱桃萝卜": "radish", "牵牛花": "morning-glory", "花椰菜": "cauliflower", "葡萄": "grape"}
STAGES = {"种植": "seed", "生长": "sprout", "成熟": "mature"}
records = []
def convert(source, destination, size):
    im = Image.open(source)
    # Backgrounds have partial alpha throughout; composite onto the scene's paper colour.
    if im.mode == "RGBA":
        paper = Image.new("RGBA", im.size, "#e9d9aa")
        paper.alpha_composite(im)
        im = paper.convert("RGB")
    else:
        im = im.convert("RGB")
    im.thumbnail(size, Image.Resampling.LANCZOS)
    destination.parent.mkdir(parents=True, exist_ok=True)
    im.save(destination, "WEBP", quality=86, method=6)
    records.append({"source": source.relative_to(ROOT).as_posix(), "file": destination.relative_to(ROOT / "public").as_posix(), "width": im.width, "height": im.height, "bytes": destination.stat().st_size})
for name, family in FAMILIES.items():
    for stage, key in STAGES.items():
        convert(SOURCE / name / (name + "-" + stage + ".png"), OUTPUT / "crops" / family / (key + ".webp"), (512, 512))
for original, name, size in [
    ("电脑端01.png", "autumn-welcome.webp", (1672, 941)),
    ("电脑端02.png", "autumn-field.webp", (1920, 1080)),
    ("手机端01.png", "autumn-mobile.webp", (900, 1600)),
]:
    convert(SOURCE / "背景" / original, OUTPUT / "scenes" / name, size)
(OUTPUT / "autumn-manifest.json").write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("Prepared", len(records), "assets;", sum(r["bytes"] for r in records), "bytes")
