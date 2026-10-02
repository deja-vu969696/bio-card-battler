import re

with open('src/data/biologyData.ts', 'r', encoding='utf-8') as f:
    code = f.read()

code = re.sub(r"export type Category = (.*?);", r"export type Category = \1 | 'physics_mechanics' | 'earth_science';", code)

code = re.sub(r"\];", "  { id: 'physics_mechanics', label: '物理学 (Physics)' },\n  { id: 'earth_science', label: '地球科学 (Earth)' },\n];", code)

new_nodes = """
  // --- PHYSICS ---
  {
    id: 'phys-1', title: '慣性の法則', category: 'physics_mechanics', subject: 'physics', status: 'unlocked', prerequisites: [], quizKey: 'shinkei',
    quiz: { question: 'だるま落としで、一番下のブロックを勢いよく叩き出しても上のブロックがそのまま落ちてくるのは、何という法則のため？', options: ['フックの法則', '慣性の法則', '作用・反作用の法則', '質量保存の法則'], answerIndex: 1, explanation: '物体が現在の運動状態を保とうとする性質を「慣性」といいます。' },
    card: { name: '慣性の法則', cost: 1, type: 'Attack', description: '敵に 6 ダメージを与える。勢いに乗り、カードを 1 枚引く。' }
  },
  {
    id: 'phys-2', title: '自由落下', category: 'physics_mechanics', subject: 'physics', status: 'locked', prerequisites: ['phys-1'], quizKey: 'shinkei',
    quiz: { question: '真空中を落下する物体において、落下する速度はどうなる？', options: ['一定のまま', '徐々に遅くなる', '徐々に速くなる', '重さによって違う'], answerIndex: 2, explanation: '重力によって下向きの力が働き続けるため、速度は一定の割合で速くなり続けます（等加速度運動）。' },
    card: { name: '自由落下', cost: 2, type: 'Attack', description: '敵に 15 ダメージを与える。このダメージはシールドを無視して直接HPに与えられる（貫通）。' }
  },
  {
    id: 'phys-3', title: '電磁誘導', category: 'physics_mechanics', subject: 'physics', status: 'locked', prerequisites: ['phys-2'], quizKey: 'shinkei',
    quiz: { question: 'コイルの中で磁石を動かすと、電圧が生じて電流が流れる現象を何という？', options: ['静電誘導', '自己誘導', '電磁誘導', '熱放射'], answerIndex: 2, explanation: '磁界の変化によって電流が生まれる現象を電磁誘導といい、発電機の原理になっています。' },
    card: { name: '電磁誘導', cost: 0, type: 'Skill', description: 'エナジーを 1 獲得し、カードを 1 枚引く。（コンボの起点に最適）' }
  },
  // --- EARTH SCIENCE ---
  {
    id: 'earth-1', title: '堆積作用', category: 'earth_science', subject: 'earth', status: 'unlocked', prerequisites: [], quizKey: 'shokubutsu_kansatsu_note',
    quiz: { question: '川の流れによって運ばれた土砂が、流れがゆるやかになった海底や湖底に積もる働きを何という？', options: ['浸食作用', '運搬作用', '堆積作用', '風化作用'], answerIndex: 2, explanation: '流水の3つの働き（浸食・運搬・堆積）のうち、積もる働きを堆積作用といいます。' },
    card: { name: '堆積作用', cost: 1, type: 'Skill', description: 'ブロックを 5 獲得する。自身に「地層」を 1 スタック付与する。' }
  },
  {
    id: 'earth-2', title: '地層の隆起', category: 'earth_science', subject: 'earth', status: 'locked', prerequisites: ['earth-1'], quizKey: 'shokubutsu_kansatsu_note',
    quiz: { question: '海底で堆積した地層が、大地の変動によって海面より上に押し上げられる現象を何という？', options: ['沈降', '隆起', '褶曲', '断層'], answerIndex: 1, explanation: '地面がもち上がることを「隆起（りゅうき）」、下がることを「沈降（ちんこう）」といいます。' },
    card: { name: '断層と隆起', cost: 2, type: 'Skill', description: '自身が持つ「地層」スタック数 × 8 のブロックを獲得する。（地層は消費しない）' }
  },
  {
    id: 'earth-3', title: '大地震', category: 'earth_science', subject: 'earth', status: 'locked', prerequisites: ['earth-2'], quizKey: 'shokubutsu_kansatsu_note',
    quiz: { question: '地震が発生した地下の場所（岩石が破壊された起点）を何という？', options: ['震央', '震源', '断層', 'マグニチュード'], answerIndex: 1, explanation: '地下の発生場所を「震源」、その真上の地表を「震央」といいます。' },
    card: { name: '大地震', cost: 3, type: 'Attack', description: '敵に 10 ダメージを与える。もし「地層」が 3 スタック以上ある場合、地層をすべて消費してさらに 40 ダメージを与える。' }
  }
"""

code = re.sub(r"\];\s*export const BOSS_DATA", new_nodes + "\n];\n\nexport const BOSS_DATA", code)

with open('src/data/biologyData.ts', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated biologyData.ts")
