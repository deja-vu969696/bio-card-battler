import re

for filename in ['src/components/BattleArena.tsx', 'src/components/PvpArena.tsx']:
    with open(filename, 'r', encoding='utf-8') as f:
        code = f.read()

    # Fix the extra brace before if (dmg > 0) {
    code = code.replace(
        "          }\n\n      if (dmg > 0) { ",
        "          \n      if (dmg > 0) { "
    )
    code = code.replace(
        "          }\n\n      if (dmg > 0) {\n",
        "          \n      if (dmg > 0) {\n"
    )

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(code)

print("Fixed brace nesting")
