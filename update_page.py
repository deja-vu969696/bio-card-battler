import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Change activeDeckNodes definition to support duplicate cards
code = code.replace(
    "const activeDeckNodes = completedNodes.filter(n => activeDeck.includes(n.id));",
    "const activeDeckNodes = activeDeck.map(id => completedNodes.find(n => n.id === id)).filter((n): n is Node => n !== undefined);"
)

# Update the minimum deck size check (before it was 4, now 8)
code = code.replace(
    "if (activeDeck.length < 4) {",
    "if (activeDeck.length < 8) {"
)
code = code.replace(
    "setToastMsg('デッキには最低 4 枚のカードが必要です。');",
    "setToastMsg('デッキには 8 枚のカードが必要です。');"
)

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated page.tsx")
