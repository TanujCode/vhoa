import pypdf

reader = pypdf.PdfReader('HOA Detailed Requirement Document v1.pdf')
print(f"Total Pages: {len(reader.pages)}")

for i in range(8, len(reader.pages)):
    print(f"=== PAGE {i+1} ===")
    print(reader.pages[i].extract_text()[:800])
