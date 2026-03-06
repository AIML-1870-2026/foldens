import os, sys
from rembg import remove, new_session

SESSION = new_session("u2net")
print("Model ready.\n")

BASE = os.path.join(os.path.dirname(__file__), "assets")
CHARACTERS = [
    ("Boar",            "boar-attacking"),
    ("Mammoth",         "mammoth-attacking"),
    ("Saber Tooth Tiger", "saber-tooth-tiger-attacking"),
    ("Club Man",        "club-man-attacking"),
    ("Stone Man",       "stone-man-attacking"),
    ("Spear Man",       "spear-man-attacking"),
    ("Bow Man",         "bow-man-attacking"),
    ("Horse Man",       "horse-man-attacking"),
    ("Sword Man",       "sword-man-attacking"),
    ("Witch",           "witch-attacking"),
    ("Vampire",         "vampire-attacking"),
    ("Ghost",           "ghost-attacking"),
    ("Cutlass Man",     "cutlass-man-attacking"),
    ("Blunderbuss Man", "blunderbuss-man-attacking"),
    ("Crossbow Man",    "crossbow-man-attacking"),
    ("Sword Pirate",    "sword-pirate-attacking"),
    ("Flintlock Pirate","flintlock-pirate-attacking"),
    ("Bomb Pirate",     "bomb-pirate-attacking"),
]

def process_character(char_folder, attack_folder):
    src_dir = os.path.join(BASE, char_folder, attack_folder)
    out_dir = os.path.join(BASE, char_folder, attack_folder.replace("-attacking", "-attacking-png"))

    if not os.path.isdir(src_dir):
        print(f"  [SKIP] {src_dir} not found")
        return

    os.makedirs(out_dir, exist_ok=True)
    frames = sorted(f for f in os.listdir(src_dir) if f.lower().endswith(".jpg"))
    total = len(frames)
    print(f"  {total} frames -> {out_dir}")

    for i, fname in enumerate(frames, 1):
        in_path  = os.path.join(src_dir, fname)
        out_path = os.path.join(out_dir, os.path.splitext(fname)[0] + ".png")
        if os.path.exists(out_path):
            continue
        with open(in_path, "rb") as f:
            result = remove(f.read(), session=SESSION)
        with open(out_path, "wb") as f:
            f.write(result)
        if i % 10 == 0 or i == total:
            print(f"    {i}/{total}", end="\r", flush=True)
    print(f"    Done: {total} frames")

if __name__ == "__main__":
    filter_char = sys.argv[1].lower() if len(sys.argv) > 1 else None
    for char_folder, attack_folder in CHARACTERS:
        if filter_char and filter_char not in char_folder.lower():
            continue
        print(f"\n[{char_folder}]")
        process_character(char_folder, attack_folder)
    print("\nAll done.")
