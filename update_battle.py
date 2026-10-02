import re

with open('src/components/BattleArena.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Update BattleState
code = code.replace(
    "playerBuffs: { poison: number; extraDraw: number; extraEnergy: number; nextAttackBonus: number; counter: number; acid: boolean; alkali: boolean; strata: number; };",
    "playerBuffs: { poison: number; extraDraw: number; extraEnergy: number; nextAttackBonus: number; counter: number; acid: boolean; alkali: boolean; strata: number; nextTurnEnergy: number; nextTurnDraw: number; pendingDiscard: number; };"
)
code = code.replace(
    "playerBuffs: { poison: 0, extraDraw: 0, extraEnergy: 0, nextAttackBonus: 0, counter: 0, acid: false, alkali: false, strata: 0 },",
    "playerBuffs: { poison: 0, extraDraw: 0, extraEnergy: 0, nextAttackBonus: 0, counter: 0, acid: false, alkali: false, strata: 0, nextTurnEnergy: 0, nextTurnDraw: 0, pendingDiscard: 0 },"
)

# Update handleCardClick
new_handle_card = """
  const handleCardClick = (uid: string) => {
    if (state.turn !== 'player' || playingCardUid) return;
    
    // Discard mode for Precision Balance
    if (state.playerBuffs.pendingDiscard > 0) {
      playSlashSound();
      setState(prev => {
        let s = { ...prev };
        s.hand = s.hand.filter(c => c.uid !== uid);
        s.discardPile = [...s.discardPile, prev.hand.find(c => c.uid === uid)!];
        s.playerBuffs.pendingDiscard -= 1;
        s.log = ['カードを捨て札に送った。', ...s.log].slice(0,10);
        return s;
      });
      return;
    }

    const cardInst = state.hand.find(c => c.uid === uid);
"""
code = code.replace(
    """  const handleCardClick = (uid: string) => {
    if (state.turn !== 'player' || playingCardUid) return;
    const cardInst = state.hand.find(c => c.uid === uid);""",
    new_handle_card
)

# Update switch logic
old_switch = """      switch (node.id) {
        case 'cell-1': dmg = 8; break;
        case 'cell-2': shield = 12; break;
        case 'cell-3': s.playerBuffs.extraDraw += 1; break;
        case 'dig-1': 
          if (s.bossBuffs.starchArmor) { dmg = 24; isCrit = true; s.bossBuffs.starchArmor = false; logMsg += ' 装甲破壊！2倍ダメージ！'; }
          else { dmg = 12; } break;
        case 'dig-2': dmg = 18; s.bossBuffs.weakness += 2; break;
        case 'dig-3': heal = 10; s.playerBuffs.extraDraw += 1; break;
        case 'cir-1': s.playerBuffs.extraEnergy += 1; break;
        case 'cir-2': s.playerBuffs.nextAttackBonus = 0.5; break;
        case 'cir-3': s.playerBuffs.poison = 0; shield = 8; break;
        case 'ner-1':
          const res1 = executeDraw(2, s.drawPile, s.discardPile);
          s.drawPile = res1.newDraw; s.discardPile = res1.newDiscard; s.hand = [...s.hand, ...res1.drawn];
          playCardDrawSound(); break;
        case 'ner-2': s.energy += 2; break;
        case 'ner-3': shield = 15; s.playerBuffs.counter = 15; break;
        case 'evo-1': dmg = 10; break;
        case 'evo-2': dmg = deck.length * 6; isCrit = true; break;
        case 'chem-1': dmg = 5; s.playerBuffs.acid = true; logMsg += ' 自身が酸性になった！'; break;
        case 'chem-2': dmg = 5; s.playerBuffs.alkali = true; logMsg += ' 自身がアルカリ性になった！'; break;
        case 'chem-3': 
          if (s.playerBuffs.acid && s.playerBuffs.alkali) {
            dmg = 30; heal = 15; isCrit = true;
            s.playerBuffs.acid = false; s.playerBuffs.alkali = false;
            logMsg += ' 中和反応コンボ発動！特大ダメージ＆回復！';
          } else {
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

new_switch = """      switch (node.id) {
        // --- BIOLOGY ---
        case 'cell-1': dmg = 8; break;
        case 'cell-2': shield = 12; break;
        case 'cell-3': s.playerBuffs.extraDraw += 1; break;
        case 'dig-1': 
          if (s.bossBuffs.starchArmor) { dmg = 24; isCrit = true; s.bossBuffs.starchArmor = false; logMsg += ' 装甲破壊！2倍ダメージ！'; }
          else { dmg = 12; } break;
        case 'dig-2': dmg = 18; s.bossBuffs.weakness += 2; break;
        case 'dig-3': heal = 12; s.playerBuffs.nextTurnDraw += 1; break;
        case 'cir-1': s.playerBuffs.extraEnergy += 1; break;
        case 'cir-2': s.playerBuffs.nextAttackBonus = 0.5; break;
        case 'cir-3': s.playerBuffs.poison = 0; shield = 8; break;
        case 'ner-1':
          const res1 = executeDraw(2, s.drawPile, s.discardPile);
          s.drawPile = res1.newDraw; s.discardPile = res1.newDiscard; s.hand = [...s.hand, ...res1.drawn];
          playCardDrawSound(); break;
        case 'ner-2': s.energy += 2; break;
        case 'ner-3': shield = 12; s.playerBuffs.counter = 14; break;
        case 'evo-1': dmg = 10; break;
        case 'evo-2': dmg = deck.length * 6; isCrit = true; break;
        
        // --- CHEMISTRY ---
        case 'chem-1': 
          s.bossShield = 0; 
          s.bossBuffs.weakness += 2; 
          logMsg += ' 装甲全壊＆弱体化付与！'; 
          break;
        case 'chem-2': 
          s.bossBuffs.poison += 3; // 毒を3ターン付与
          logMsg += ' 敵に毒を付与した！'; 
          break;
        
        // --- PHYSICS ---
        case 'phys-1': dmg = 7; s.playerBuffs.extraDraw += 1; break;
        case 'phys-2': dmg = 16; pierce = true; logMsg += ' 貫通ダメージ！'; break;
        case 'phys-3': s.energy += 2; s.playerBuffs.extraDraw += 1; break;
        
        // --- EARTH ---
        case 'earth-1': shield = 8; s.playerBuffs.strata += 1; break;
        case 'earth-2': shield = s.playerBuffs.strata * 8; break;
        case 'earth-3': 
          if (s.playerBuffs.strata >= 3) {
            dmg = 50; isCrit = true; s.playerBuffs.strata = 0; logMsg += ' 大地震発生！！（地層全消費）';
          } else {
            dmg = 15;
          }
          break;

        // --- NEUTRAL ---
        case 'neu-1':
          const resNeu1 = executeDraw(2, s.drawPile, s.discardPile);
          s.drawPile = resNeu1.newDraw; s.discardPile = resNeu1.newDiscard; s.hand = [...s.hand, ...resNeu1.drawn];
          if (resNeu1.drawn.length > 0) {
            s.playerBuffs.pendingDiscard += 1;
            logMsg += ' 2枚引き、1枚捨てる。捨てるカードを選んでください。';
          }
          playCardDrawSound(); 
          break;
        case 'neu-2':
          shield = 10;
          const hasNeutral = s.hand.some(c => {
             const n = deck.find(dn => dn.id === c.nodeId);
             return n?.subject === 'neutral' && c.uid !== uid;
          });
          if (hasNeutral) { shield += 5; logMsg += ' 手札の中立カードと共鳴して追加ブロック！'; }
          break;
        case 'neu-3':
          if (s.playerBuffs.poison > 0) { s.playerBuffs.poison = 0; logMsg += ' 毒を解除！'; }
          else if (s.playerBuffs.weakness && s.playerBuffs.weakness > 0) { s.playerBuffs.weakness = 0; logMsg += ' 弱体化を解除！'; }
          s.playerBuffs.extraDraw += 1;
          break;
        case 'neu-4':
          dmg = 8;
          s.playerBuffs.nextTurnEnergy += 1;
          logMsg += ' 次のターン、エナジー追加獲得！';
          break;
      }"""

# A somewhat robust regex approach to replacing the switch block:
code = re.sub(r"      switch \(node\.id\) \{.*?      \}", new_switch, code, flags=re.DOTALL)

# Update energy/draw processing
code = code.replace(
    "s.energy = 3 + s.playerBuffs.extraEnergy;",
    "s.energy = 3 + s.playerBuffs.extraEnergy + s.playerBuffs.nextTurnEnergy;\n          s.playerBuffs.nextTurnEnergy = 0;"
)
code = code.replace(
    "const toDraw = 4 + s.playerBuffs.extraDraw;",
    "const toDraw = 4 + s.playerBuffs.extraDraw + s.playerBuffs.nextTurnDraw;\n          s.playerBuffs.extraDraw = 0; s.playerBuffs.nextTurnDraw = 0;"
)
# Ensure extraDraw isn't reset twice if it already was:
code = code.replace(
    "s.playerBuffs.extraDraw = 0; \n          \n          const { newDraw",
    "\n          const { newDraw"
)

# Boss poison logic
# The old script added `poison += intent.value` to `playerBuffs.poison`. In the new mechanics, we might want boss to deal fixed damage, but the boss poison intent currently deals damage based on stack. We leave player poison mechanics as-is for the boss, but we must modify how boss takes poison damage!
# Wait, chem-2 adds poison to boss!
boss_poison_logic = """
          if (s.bossHp <= 0) { s.turn = 'gameover'; setTimeout(() => onVictory(), 1000); return s; }
          if (s.playerHp <= 0) { s.turn = 'gameover'; setTimeout(() => onDefeat(), 1000); return s; }

          // ボス毒ダメージの処理 (8ダメージ x stack) 
          if (s.bossBuffs.poison > 0) {
             const poisonDmg = 8; // 固定8ダメージ
             s.bossHp = Math.max(0, s.bossHp - poisonDmg);
             addFloatingText(s, `-${poisonDmg} 毒`, 'damage', 'boss');
             s.bossBuffs.poison -= 1;
          }
          if (s.bossHp <= 0) { s.turn = 'gameover'; setTimeout(() => onVictory(), 1000); return s; }
"""

code = code.replace(
    "if (s.bossHp <= 0) { s.turn = 'gameover'; setTimeout(() => onVictory(), 1000); return s; }\n          if (s.playerHp <= 0) { s.turn = 'gameover'; setTimeout(() => onDefeat(), 1000); return s; }",
    boss_poison_logic
)

with open('src/components/BattleArena.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated BattleArena.tsx")
