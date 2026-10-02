import re

with open('src/data/biologyData.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update Subject and Category types
code = re.sub(r"export type Subject = 'biology' \| 'chemistry' \| 'physics' \| 'earth';", "export type Subject = 'biology' | 'chemistry' | 'physics' | 'earth' | 'neutral';", code)
code = re.sub(r"export type Category = 'cell' \| 'digestion' \| 'circulation' \| 'nerve' \| 'evolution' \| 'chemistry_reaction' \| 'physics_mechanics' \| 'earth_science';", "export type Category = 'cell' | 'digestion' | 'circulation' | 'nerve' | 'evolution' | 'chemistry_reaction' | 'physics_mechanics' | 'earth_science' | 'scientific_inquiry';", code)

# 2. Add Category mapping
code = code.replace("{ id: 'earth_science', label: '地球科学 (Earth)' },", "{ id: 'earth_science', label: '地球科学 (Earth)' },\n  { id: 'scientific_inquiry', label: '科学探究 (Neutral)' },")

# 3. Update existing Biology cards (ner-3 and dig-3)
code = re.sub(r"card: \{ name: 'せき髄反射', cost: 1, type: 'Skill', description: 'ブロックを 15 獲得する。次のターンに「反射構え」状態となり、受けたダメージを反射する。' \}", "card: { name: 'せき髄反射', cost: 2, type: 'Skill', description: 'ブロックを 12 獲得する。相手が攻撃してきた場合、相手に 14 のカウンターダメージを与える。' }", code)
code = re.sub(r"card: \{ name: '小腸の柔毛', cost: 1, type: 'Skill', description: 'HPを 10 回復する。カードを 1 枚引く。' \}", "card: { name: '小腸の柔毛', cost: 1, type: 'Skill', description: 'HPを 12 回復する。次のターンの開始時、カード追加で 1 枚引く。' }", code)

# 4. Replace Chemistry cards entirely
chem_replacement = """
  // --- CHEMISTRY ---
  {
    id: 'chem-1', title: '強酸溶解', category: 'chemistry_reaction', subject: 'chemistry', status: 'unlocked', prerequisites: [], quizKey: 'amylase',
    quiz: { question: '青色リトマス紙を赤色に変える水溶液の性質は？', options: ['酸性', '中性', 'アルカリ性', '塩基性'], answerIndex: 0, explanation: '酸性の水溶液は青色リトマス紙を赤色にします。' },
    card: { name: '強酸溶解', cost: 1, type: 'Skill', description: '相手のシールドを完全に破壊し、2ターンの間「弱体化（与ダメージ-25%）」を付与する。' }
  },
  {
    id: 'chem-2', title: '硫化水素ガス', category: 'chemistry_reaction', subject: 'chemistry', status: 'unlocked', prerequisites: [], quizKey: 'amylase',
    quiz: { question: '火山ガスなどに含まれる、卵の腐ったような特有のにおいを持つ有毒な気体は？', options: ['二酸化炭素', '硫化水素', 'アンモニア', '塩素'], answerIndex: 1, explanation: '硫化水素は腐乱臭（卵の腐ったにおい）を持つ有毒ガスです。' },
    card: { name: '硫化水素ガス', cost: 2, type: 'Skill', description: '相手に「毒（毎ターン終了時に8ダメージ）」を3ターン付与する。' }
  },
"""
# Replace from `// --- CHEMISTRY ---` down to right before `// --- PHYSICS ---`
code = re.sub(r"  // --- CHEMISTRY ---.*?  // --- PHYSICS ---", chem_replacement + "  // --- PHYSICS ---", code, flags=re.DOTALL)

# 5. Replace Physics cards entirely
phys_replacement = """
  // --- PHYSICS ---
  {
    id: 'phys-1', title: '慣性の法則', category: 'physics_mechanics', subject: 'physics', status: 'unlocked', prerequisites: [], quizKey: 'shinkei',
    quiz: { question: 'だるま落としで、一番下のブロックを勢いよく叩き出しても上のブロックがそのまま落ちてくるのは、何という法則のため？', options: ['フックの法則', '慣性の法則', '作用・反作用の法則', '質量保存の法則'], answerIndex: 1, explanation: '物体が現在の運動状態を保とうとする性質を「慣性」といいます。' },
    card: { name: '慣性の法則', cost: 1, type: 'Attack', description: '敵に 7 ダメージを与える。勢いに乗り、カードを 1 枚引く。' }
  },
  {
    id: 'phys-2', title: '自由落下', category: 'physics_mechanics', subject: 'physics', status: 'locked', prerequisites: ['phys-1'], quizKey: 'shinkei',
    quiz: { question: '真空中を落下する物体において、落下する速度はどうなる？', options: ['一定のまま', '徐々に遅くなる', '徐々に速くなる', '重さによって違う'], answerIndex: 2, explanation: '重力によって下向きの力が働き続けるため、速度は一定の割合で速くなり続けます（等加速度運動）。' },
    card: { name: '自由落下', cost: 2, type: 'Attack', description: '敵に 16 ダメージを与える。このダメージはシールドを無視して直接HPに与えられる（貫通）。' }
  },
  {
    id: 'phys-3', title: '電磁誘導', category: 'physics_mechanics', subject: 'physics', status: 'locked', prerequisites: ['phys-2'], quizKey: 'shinkei',
    quiz: { question: 'コイルの中で磁石を動かすと、電圧が生じて電流が流れる現象を何という？', options: ['静電誘導', '自己誘導', '電磁誘導', '熱放射'], answerIndex: 2, explanation: '磁界の変化によって電流が生まれる現象を電磁誘導といい、発電機の原理になっています。' },
    card: { name: '電磁誘導', cost: 1, type: 'Skill', description: 'エナジーを 2 獲得し、カードを 1 枚引く。（コンボの起点に最適）' }
  },
"""
code = re.sub(r"  // --- PHYSICS ---.*?  // --- EARTH SCIENCE ---", phys_replacement + "  // --- EARTH SCIENCE ---", code, flags=re.DOTALL)

# 6. Replace Earth cards entirely
earth_replacement = """
  // --- EARTH SCIENCE ---
  {
    id: 'earth-1', title: '堆積作用', category: 'earth_science', subject: 'earth', status: 'unlocked', prerequisites: [], quizKey: 'shokubutsu_kansatsu_note',
    quiz: { question: '川の流れによって運ばれた土砂が、流れがゆるやかになった海底や湖底に積もる働きを何という？', options: ['浸食作用', '運搬作用', '堆積作用', '風化作用'], answerIndex: 2, explanation: '流水の3つの働き（浸食・運搬・堆積）のうち、積もる働きを堆積作用といいます。' },
    card: { name: '堆積作用', cost: 1, type: 'Skill', description: 'ブロックを 8 獲得する。自身に「地層」を 1 スタック付与する。' }
  },
  {
    id: 'earth-2', title: '地層の隆起', category: 'earth_science', subject: 'earth', status: 'locked', prerequisites: ['earth-1'], quizKey: 'shokubutsu_kansatsu_note',
    quiz: { question: '海底で堆積した地層が、大地の変動によって海面より上に押し上げられる現象を何という？', options: ['沈降', '隆起', '褶曲', '断層'], answerIndex: 1, explanation: '地面がもち上がることを「隆起（りゅうき）」、下がることを「沈降（ちんこう）」といいます。' },
    card: { name: '断層と隆起', cost: 2, type: 'Skill', description: '自身が持つ「地層」スタック数 × 8 のブロックを獲得する。（地層は消費しない）' }
  },
  {
    id: 'earth-3', title: '大地震', category: 'earth_science', subject: 'earth', status: 'locked', prerequisites: ['earth-2'], quizKey: 'shokubutsu_kansatsu_note',
    quiz: { question: '地震が発生した地下の場所（岩石が破壊された起点）を何という？', options: ['震央', '震源', '断層', 'マグニチュード'], answerIndex: 1, explanation: '地下の発生場所を「震源」、その真上の地表を「震央」といいます。' },
    card: { name: '大地震', cost: 3, type: 'Attack', description: '敵に 15 ダメージを与える。もし「地層」が 3 スタック以上ある場合、地層をすべて消費してさらに 35 ダメージ（計50）を与える。' }
  },
"""
code = re.sub(r"  // --- EARTH SCIENCE ---.*?\n\];", earth_replacement + "\n];", code, flags=re.DOTALL)

# 7. Add Neutral cards
neutral_replacement = """
  // --- NEUTRAL ---
  {
    id: 'neu-1', title: '精密天秤', category: 'scientific_inquiry', subject: 'neutral', status: 'unlocked', prerequisites: [],
    quiz: { question: '上皿てんびんで重さを量る際、分銅はどの順番でのせていくのが正しい？', options: ['軽いものから', '重いものから', '適当なものから', 'すべて同時に'], answerIndex: 1, explanation: '量りたいものより少し重いと思われる分銅からのせていき、徐々に軽いものに替えていきます。' },
    card: { name: '精密天秤', cost: 1, type: 'Skill', description: '山札の上から2枚を見て、1枚を選んで手札に加え、もう1枚を捨て札へ送る。' }
  },
  {
    id: 'neu-2', title: '耐熱ビーカー', category: 'scientific_inquiry', subject: 'neutral', status: 'unlocked', prerequisites: [],
    quiz: { question: '液体を加熱する際、急激な沸騰（突沸）を防ぐために入れるものは？', options: ['沸騰石', 'ガラス棒', 'ろ紙', 'ピンセット'], answerIndex: 0, explanation: '沸騰石の細かい穴にある空気が少しずつ泡となり、液体の急激な沸騰を防ぎます。' },
    card: { name: '耐熱ビーカー', cost: 1, type: 'Skill', description: 'ブロックを 10 獲得。手札に他の無属性（中立）カードがある場合、さらにブロックを 5 獲得。' }
  },
  {
    id: 'neu-3', title: '対照実験', category: 'scientific_inquiry', subject: 'neutral', status: 'unlocked', prerequisites: [],
    quiz: { question: 'ある条件だけを変え、他の条件はすべて同じにして行う実験を何という？', options: ['思考実験', '対照実験', '確認実験', '比較実験'], answerIndex: 1, explanation: '調べたい条件以外の条件をそろえて行う実験を「対照実験（たいしょうじっけん）」といいます。' },
    card: { name: '対照実験', cost: 0, type: 'Skill', description: '自身にかかっているデバフ（毒・弱体化など）を1つ解除し、カードを 1 枚引く。' }
  },
  {
    id: 'neu-4', title: '仮説と検証', category: 'scientific_inquiry', subject: 'neutral', status: 'unlocked', prerequisites: [],
    quiz: { question: '科学的な問題解決において、予想を立てることを何という？', options: ['観察', '結論', '考察', '仮説'], answerIndex: 3, explanation: '結果を予想して立てた考えを「仮説」といい、それを実験などで確かめます。' },
    card: { name: '仮説と検証', cost: 1, type: 'Attack', description: '敵に 8 ダメージを与える。次のターンの開始時、エナジーを 1 獲得。' }
  }
"""
code = code.replace("\n];\n\nexport const BOSS_DATA", neutral_replacement + "\n];\n\nexport const BOSS_DATA")

with open('src/data/biologyData.ts', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated biologyData.ts")
