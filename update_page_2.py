import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix deck validation to exactly 8 cards
code = re.sub(r"if \(\(tab === 'battle' \|\| tab === 'pvp'\) && activeDeck\.length [^\)]+\) \{", "if ((tab === 'battle' || tab === 'pvp') && activeDeck.length !== 8) {", code)

# Fix the ToastMsg line to say 8 cards
code = re.sub(r"setToastMsg\(`.*?`\);", "setToastMsg(`デッキは厳密に8枚である必要があります。（現在 ${activeDeck.length}枚）`);", code, count=1)

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated page.tsx")
