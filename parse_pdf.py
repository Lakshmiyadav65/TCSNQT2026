import fitz
import json
import re

pdf_path = r"C:\Users\laksh\AppData\Local\Packages\5319275A.WhatsAppDesktop_cv1g1gvanyjgm\LocalState\sessions\EA4B670AF02C8A660484146EA1F1316A23C0FC3B\transfers\2026-11\100 aptitude trick(102pgs)s.pdf"

doc = fitz.open(pdf_path)
full_text = ""

for i in range(2, len(doc)): # Skip first 2 title/index pages
    text = doc[i].get_text()
    text = text.replace("www.iascgl.com", " ")
    text = text.strip()
    full_text += text + "\n\n"

# Split by Shortcut #
tricks_raw = full_text.split("Shortcut #")
tricks = []

for i, raw in enumerate(tricks_raw):
    raw = raw.strip()
    if not raw: continue
    
    # Try to extract number and topic
    lines = raw.split("\n")
    header = lines[0].strip()
    
    match = re.search(r'^(\d+)\s*(.*?)(?:\s*[-–]\s*(.*))?$', header)
    
    if match:
        trick_num = match.group(1)
        trick_title = header
    else:
        trick_num = i
        trick_title = header
    
    content = "\n".join(lines[1:]).strip()
    
    tricks.append({
        "id": trick_num,
        "title": trick_title,
        "content": content
    })

with open("data/aptitude-tricks.json", "w", encoding="utf-8") as f:
    json.dump(tricks, f, indent=4)

print(f"Extracted {len(tricks)} tricks.")
