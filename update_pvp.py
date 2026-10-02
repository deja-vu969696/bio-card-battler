import re

with open('src/components/PvpArena.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Update PvpState buffs
code = code.replace(
    "buffs: { poison: number; extraDraw: number; extraEnergy: number; nextAttackBonus: number; counter: number; weakness: number; acid: boolean; alkali: boolean; strata: number; };",
    "buffs: { poison: number; extraDraw: number; extraEnergy: number; nextAttackBonus: number; counter: number; weakness: number; acid: boolean; alkali: boolean; strata: number; nextTurnEnergy: number; nextTurnDraw: number; pendingDiscard: number; };"
)
code = code.replace(
    "buffs: { poison: 0, extraDraw: 0, extraEnergy: 0, nextAttackBonus: 0, counter: 0, weakness: 0, acid: false, alkali: false, strata: 0 },",
    "buffs: { poison: 0, extraDraw: 0, extraEnergy: 0, nextAttackBonus: 0, counter: 0, weakness: 0, acid: false, alkali: false, strata: 0, nextTurnEnergy: 0, nextTurnDraw: 0, pendingDiscard: 0 },"
)

# Update handleCardClick
new_handle_card = """
  const handleCardClick = (uid: string) => {
    if (state.turn !== 'self' || playingCardUid) return;

    // Discard mode for Precision Balance
    if (state.buffs.pendingDiscard > 0) {
      playSlashSound();
      setState(prev => {
        let s = { ...prev };
        s.hand = s.hand.filter(c => c.uid !== uid);
        s.discardPile = [...s.discardPile, prev.hand.find(c => c.uid === uid)!];
        s.buffs.pendingDiscard -= 1;
        s.log = ['カードを捨て札に送った。', ...s.log].slice(0,10);
        return s;
      });
      return;
    }

    const cardInst = state.hand.find(c => c.uid === uid);
"""
code = code.replace(
    """  const handleCardClick = (uid: string) => {
    if (state.turn !== 'self' || playingCardUid) return;
    const cardInst = state.hand.find(c => c.uid === uid);""",
    new_handle_card
)

# Update switch logic
new_switch = """      switch (node.id) {
        // --- BIOLOGY ---
        case 'cell-1': dmg = 8; break;
        case 'cell-2': shield = 12; break;
        case 'cell-3': s.buffs.extraDraw += 1; break;
        case 'dig-1': 
          if (s.oppShield > 0) { dmg = 24; isCrit = true; breakShield = true; logMsg += ' 装甲破壊！2倍ダメージ！'; }
          else { dmg = 12; } break;
        case 'dig-2': dmg = 18; applyWeakness = 2; break;
        case 'dig-3': heal = 12; s.buffs.nextTurnDraw += 1; break;
        case 'cir-1': s.buffs.extraEnergy += 1; break;
        case 'cir-2': s.buffs.nextAttackBonus = 0.5; break;
        case 'cir-3': s.buffs.poison = 0; shield = 8; break;
        case 'ner-1':
          const res1 = executeDraw(2, s.drawPile, s.discardPile);
          s.drawPile = res1.newDraw; s.discardPile = res1.newDiscard; s.hand = [...s.hand, ...res1.drawn];
          playCardDrawSound(); break;
        case 'ner-2': s.energy += 2; break;
        case 'ner-3': shield = 12; s.buffs.counter = 14; break;
        case 'evo-1': dmg = 10; break;
        case 'evo-2': dmg = deck.length * 6; isCrit = true; break;

        // --- CHEMISTRY ---
        case 'chem-1': 
          breakShield = true; 
          applyWeakness = 2; 
          logMsg += ' 敵のシールドを全破壊し、弱体化を付与！'; 
          break;
        case 'chem-2': 
          // 毒を3ターン付与。PvpではATTACKペイロードの代わりに専用ペイロードかバフ同期？
          // POISONペイロードがないので、一旦自身のバフUIではなく、直接POISONを送る。
          channelRef.current?.send({ type: 'broadcast', event: 'game_action', payload: { action: 'APPLY_POISON', value: 3 } });
          logMsg += ' 敵に毒を付与した！'; 
          break;

        // --- PHYSICS ---
        case 'phys-1': dmg = 7; s.buffs.extraDraw += 1; break;
        case 'phys-2': dmg = 16; pierce = true; logMsg += ' 貫通ダメージ！'; break;
        case 'phys-3': s.energy += 2; s.buffs.extraDraw += 1; break;
        
        // --- EARTH ---
        case 'earth-1': shield = 8; s.buffs.strata += 1; break;
        case 'earth-2': shield = s.buffs.strata * 8; break;
        case 'earth-3': 
          if (s.buffs.strata >= 3) {
            dmg = 50; isCrit = true; s.buffs.strata = 0; logMsg += ' 大地震発生！！（地層全消費）';
          } else {
            dmg = 15;
          }
          break;

        // --- NEUTRAL ---
        case 'neu-1':
          const resNeu1 = executeDraw(2, s.drawPile, s.discardPile);
          s.drawPile = resNeu1.newDraw; s.discardPile = resNeu1.newDiscard; s.hand = [...s.hand, ...resNeu1.drawn];
          if (resNeu1.drawn.length > 0) {
            s.buffs.pendingDiscard += 1;
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
          if (s.buffs.poison > 0) { s.buffs.poison = 0; logMsg += ' 毒を解除！'; }
          else if (s.buffs.weakness > 0) { s.buffs.weakness = 0; logMsg += ' 弱体化を解除！'; }
          s.buffs.extraDraw += 1;
          break;
        case 'neu-4':
          dmg = 8;
          s.buffs.nextTurnEnergy += 1;
          logMsg += ' 次のターン、エナジー追加獲得！';
          break;
      }"""

code = re.sub(r"      switch \(node\.id\) \{.*?      \}", new_switch, code, flags=re.DOTALL)

# Handle APPLY_POISON payload in game_action receiver
apply_poison_logic = """
        else if (payload.action === 'APPLY_POISON') {
          s.buffs.poison += payload.value;
          s.log = [`毒 ${payload.value} ターンを付与された！`, ...s.log].slice(0, 10);
          addFloatingText(s, `POISON +${payload.value}`, 'crit', 'self');
        }
"""
code = code.replace(
    "if (payload.action === 'SYNC') {",
    apply_poison_logic + "\n        if (payload.action === 'SYNC') {"
)

# Update start turn energy/draw logic (this happens when channel receives TURN_END and we become 'self')
# Wait, let's find where 'self' turn starts. It's when receiving TURN_END.
turn_end_receiver = """
        else if (payload.action === 'TURN_END') {
          s.turn = 'self';
          s.timer = 45;
          s.shield = 0; 
          s.energy = 3 + s.buffs.extraEnergy + s.buffs.nextTurnEnergy;
          s.buffs.nextTurnEnergy = 0;
          
          let toDraw = 4 + s.buffs.extraDraw + s.buffs.nextTurnDraw;
          s.buffs.extraDraw = 0; s.buffs.nextTurnDraw = 0;
          
          if (s.buffs.poison > 0) {
             const poisonDmg = 8; // 固定8ダメージ
             s.hp = Math.max(0, s.hp - poisonDmg);
             s.buffs.poison -= 1;
             s.log = [`毒により ${poisonDmg} のダメージ！`, ...s.log].slice(0, 10);
             addFloatingText(s, `-${poisonDmg} 毒`, 'damage', 'self');
          }
"""
# Replace the original TURN_END block. Let's find it.
# The original might be something like:
# else if (payload.action === 'TURN_END') {
#   s.turn = 'self';
#   s.timer = 45;
#   s.shield = 0;
#   s.energy = 3 + s.buffs.extraEnergy;
#   let toDraw = 4 + s.buffs.extraDraw;
#   s.buffs.extraDraw = 0;
# ... (and poison logic)
# To be safe, I'll regex it carefully.
old_turn_end_pattern = r"else if \(payload\.action === 'TURN_END'\) \{.*?\n\s+const \{ newDraw, newDiscard, drawn \}"

new_turn_end_code = """else if (payload.action === 'TURN_END') {
          s.turn = 'self';
          s.timer = 45;
          s.shield = 0; 
          s.energy = 3 + s.buffs.extraEnergy + s.buffs.nextTurnEnergy;
          s.buffs.nextTurnEnergy = 0;
          
          let toDraw = 4 + s.buffs.extraDraw + s.buffs.nextTurnDraw;
          s.buffs.extraDraw = 0; s.buffs.nextTurnDraw = 0;
          
          if (s.buffs.poison > 0) {
             const poisonDmg = 8; // 固定8ダメージ
             s.hp = Math.max(0, s.hp - poisonDmg);
             s.buffs.poison -= 1;
             s.log = [`毒により ${poisonDmg} のダメージ！`, ...s.log].slice(0, 10);
             addFloatingText(s, `-${poisonDmg} 毒`, 'damage', 'self');
          }
          if (s.hp <= 0) {
             s.turn = 'gameover';
             s.resultMsg = 'DEFEAT...';
             channelRef.current?.send({ type: 'broadcast', event: 'game_action', payload: { action: 'GAMEOVER', winner: 'opponent' }});
          }

          const { newDraw, newDiscard, drawn }"""

code = re.sub(old_turn_end_pattern, new_turn_end_code, code, flags=re.DOTALL)

with open('src/components/PvpArena.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated PvpArena.tsx")
