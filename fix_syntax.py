import re

for filename in ['src/components/BattleArena.tsx', 'src/components/PvpArena.tsx']:
    with open(filename, 'r', encoding='utf-8') as f:
        code = f.read()
    
    # Add back the closing brace of the switch statement
    code = code.replace("      if (dmg > 0) {", "      }\n\n      if (dmg > 0) {")
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(code)

print("Fixed syntax")
