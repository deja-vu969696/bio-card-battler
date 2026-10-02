import re

for filename in ['src/components/BattleArena.tsx', 'src/components/PvpArena.tsx']:
    with open(filename, 'r', encoding='utf-8') as f:
        code = f.read()

    # Find the wrongly inserted '}' before the second 'if (dmg > 0)'
    # We want to remove the '}' that was wrongly added in the boss turn logic (BattleArena)
    # and opponent attack logic (PvpArena).
    
    # Let's just fix it by replacing the specific bad patterns.
    # In BattleArena.tsx:
    code = code.replace(
        "            }\n\n      if (dmg > 0) {\n              s.playerHp = Math.max",
        "            if (dmg > 0) {\n              s.playerHp = Math.max"
    )
    
    # In PvpArena.tsx:
    code = code.replace(
        "            }\n\n      if (dmg > 0) { \n            s.hp = Math.max",
        "            if (dmg > 0) { \n            s.hp = Math.max"
    )
    code = code.replace(
        "            }\n\n      if (dmg > 0) {\n            s.hp = Math.max",
        "            if (dmg > 0) {\n            s.hp = Math.max"
    )
    
    # Let's do a more robust regex to fix the dangling else in both files.
    # We know there's a dangling '} else if' because of an extra '}'
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(code)

print("Fixed syntax")
