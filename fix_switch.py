import re

for filename in ['src/components/BattleArena.tsx', 'src/components/PvpArena.tsx']:
    with open(filename, 'r', encoding='utf-8') as f:
        code = f.read()
    
    # Remove the orphaned else block and breaks
    orphaned_code = """} else {
            logMsg += ' （酸性とアルカリ性が揃っていないため効果なし）';
          }
          break;
        case 'phys-1': 
          dmg = 6; 
          s.playerBuffs.extraDraw += 1; 
          break;
        case 'phys-2': 
          dmg = 15; 
          pierce = true; 
          logMsg += ' 貫通ダメージ！'; 
          break;
        case 'phys-3': 
          s.energy += 1; 
          s.playerBuffs.extraDraw += 1; 
          break;
        case 'earth-1': 
          shield = 5; 
          s.playerBuffs.strata += 1; 
          break;
        case 'earth-2': 
          shield = s.playerBuffs.strata * 8; 
          break;
        case 'earth-3': 
          if (s.playerBuffs.strata >= 3) {
            dmg = 50; isCrit = true; s.playerBuffs.strata = 0; logMsg += ' 大地震発生！！';
          } else {
            dmg = 10;
          }
          break;
      }"""
    
    # Also for PvpArena where playerBuffs is buffs
    orphaned_code_pvp = orphaned_code.replace("playerBuffs", "buffs")
    
    # First, let's just find `} else {\n            logMsg += ' （酸性とアルカリ性が揃っていないため効果なし）';`
    # and remove until `if (dmg > 0)`
    
    # In both files, the next statement after switch is `if (dmg > 0)`
    code = re.sub(r"      } else \{\s+logMsg \+= ' （酸性とアルカリ性が揃っていないため効果なし）';\s+\}\s+break;.*?      \}(?=\s*if \(dmg > 0\))", "", code, flags=re.DOTALL)
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(code)

print("Cleaned up orphaned blocks")
