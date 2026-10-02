import re

with open('src/components/BattleArena.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Add weakness to playerBuffs
code = code.replace(
    "playerBuffs: { poison: number; extraDraw: number; extraEnergy: number; nextAttackBonus: number; counter: number; acid: boolean; alkali: boolean; strata: number; nextTurnEnergy: number; nextTurnDraw: number; pendingDiscard: number; };",
    "playerBuffs: { poison: number; extraDraw: number; extraEnergy: number; nextAttackBonus: number; counter: number; acid: boolean; alkali: boolean; strata: number; nextTurnEnergy: number; nextTurnDraw: number; pendingDiscard: number; weakness?: number; };"
)

with open('src/components/BattleArena.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
