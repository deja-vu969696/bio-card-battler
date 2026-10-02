export type Subject = 'biology' | 'chemistry' | 'physics' | 'earth' | 'neutral';
export type Category = 'cell' | 'digestion' | 'circulation' | 'nerve' | 'evolution' | 'chemistry_reaction' | 'physics_mechanics' | 'earth_science' | 'scientific_inquiry';
export type Status = 'unlocked' | 'completed' | 'locked';
export type CardType = 'Attack' | 'Skill' | 'Power';

export interface CardDef {
  name: string;
  cost: number;
  type: CardType;
  description: string;
}

export interface Node {
  id: string;
  title: string;
  category: Category;
  subject: Subject;
  status: Status;
  prerequisites: string[];
  quizKey?: string;
  quiz: { question: string; options: string[]; answerIndex: number; explanation: string };
  card: CardDef;
}

export interface BossIntent {
  action: 'attack' | 'defend' | 'starch_armor' | 'poison';
  value: number;
  description: string;
}

export interface Boss {
  name: string;
  maxHp: number;
  pattern: BossIntent[];
}

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'cell', label: '細胞 (Cell)' },
  { id: 'digestion', label: '消化と吸収 (Digestion)' },
  { id: 'circulation', label: '呼吸と循環 (Circulation)' },
  { id: 'nerve', label: '刺激と反応 (Nerve)' },
  { id: 'evolution', label: '生物の変遷 (Evolution)' },
  { id: 'chemistry_reaction', label: '化学変化 (Chemistry)' },
  { id: 'physics_mechanics', label: '物理学 (Physics)' },
  { id: 'earth_science', label: '地球科学 (Earth)' },
  { id: 'scientific_inquiry', label: '科学探究 (Neutral)' },
];

export const INITIAL_NODES: Node[] = [
  // --- CELL ---
  {
    id: 'cell-1', title: '細胞の基本構造', category: 'cell', subject: 'biology', status: 'unlocked', prerequisites: [], quizKey: 'shokubutsu_kansatsu_note',
    quiz: { question: '細胞の中でエネルギーを取り出す部分は？', options: ['核', '細胞膜', 'ミトコンドリア', '葉緑体'], answerIndex: 2, explanation: 'ミトコンドリアで細胞の呼吸が行われます。' },
    card: { name: '細胞の基本', cost: 1, type: 'Attack', description: '敵に 8 ダメージを与える。' }
  },
  {
    id: 'cell-2', title: '植物と動物の細胞', category: 'cell', subject: 'biology', status: 'locked', prerequisites: ['cell-1'], quizKey: 'shokubutsu_kansatsu_note',
    quiz: { question: '植物細胞に特有の作りは？', options: ['核・細胞膜', '葉緑体・細胞壁', '細胞質・液胞', 'ミトコンドリア・核'], answerIndex: 1, explanation: '光合成を行う葉緑体と、体を支える細胞壁があります。' },
    card: { name: '細胞壁展開', cost: 2, type: 'Skill', description: 'ブロックを 12 獲得する。' }
  },
  {
    id: 'cell-3', title: '細胞呼吸', category: 'cell', subject: 'biology', status: 'locked', prerequisites: ['dig-3', 'cir-2'], quizKey: 'haiho',
    quiz: { question: '細胞呼吸で発生する不要物は？', options: ['二酸化炭素と水', '酸素とアンモニア', 'デンプンと酸素', '二酸化炭素と尿素'], answerIndex: 0, explanation: '細胞呼吸では二酸化炭素と水ができます。' },
    card: { name: '細胞呼吸', cost: 2, type: 'Power', description: '戦闘終了まで、毎ターン開始時のドロー枚数を +1 する。' }
  },
  // --- DIGESTION ---
  {
    id: 'dig-1', title: 'だ液と消化酵素', category: 'digestion', subject: 'biology', status: 'locked', prerequisites: ['cell-1'], quizKey: 'amylase',
    quiz: { question: 'だ液の「アミラーゼ」が分解する栄養分は？', options: ['タンパク質', '脂肪', 'デンプン', 'ビタミン'], answerIndex: 2, explanation: 'デンプンを糖に分解します。' },
    card: { name: 'だ液アミラーゼ', cost: 1, type: 'Attack', description: '敵に 12 ダメージを与える。敵が「デンプン装甲」を持つ場合、装甲を破壊して2倍ダメージ！' }
  },
  {
    id: 'dig-2', title: '胃と腸の働き', category: 'digestion', subject: 'biology', status: 'locked', prerequisites: ['dig-1'], quizKey: 'amylase',
    quiz: { question: '胃液の「ペプシン」が主に分解する栄養分は？', options: ['デンプン', '脂肪', 'ブドウ糖', 'タンパク質'], answerIndex: 3, explanation: 'タンパク質の消化を助けます。' },
    card: { name: '胃液ペプシン', cost: 2, type: 'Attack', description: '敵に 18 ダメージを与え、2ターンの「弱体化（ダメージ25%減）」を付与する。' }
  },
  {
    id: 'dig-3', title: '小腸での吸収', category: 'digestion', subject: 'biology', status: 'locked', prerequisites: ['dig-2'], quizKey: 'amylase',
    quiz: { question: '小腸の壁にある無数の突起は？', options: ['繊毛', '柔毛', '肺胞', '根毛'], answerIndex: 1, explanation: '柔毛があることで効率よく栄養分を吸収できます。' },
    card: { name: '小腸の柔毛', cost: 1, type: 'Skill', description: 'HPを 10 回復し、次のターンのドロー枚数を +1 する。' }
  },
  // --- CIRCULATION ---
  {
    id: 'cir-1', title: '肺胞とガス交換', category: 'circulation', subject: 'biology', status: 'locked', prerequisites: ['cell-1'], quizKey: 'haiho',
    quiz: { question: '気管支の先にある肺胞が多いことの利点は？', options: ['空気をためる', '表面積が大きくなる', '肺を軽くする', 'ほこりを防ぐ'], answerIndex: 1, explanation: '表面積が大きくなりガス交換が速やかに行われます。' },
    card: { name: '肺胞のガス交換', cost: 1, type: 'Power', description: '戦闘終了まで、毎ターンのエナジー回復量が +1 される。' }
  },
  {
    id: 'cir-2', title: '心臓と血液の循環', category: 'circulation', subject: 'biology', status: 'locked', prerequisites: ['cir-1'], quizKey: 'hakkekkyu',
    quiz: { question: '心臓から肺へ向かう血液が通る血管は？', options: ['肺動脈', '肺静脈', '大動脈', '大静脈'], answerIndex: 0, explanation: '心臓から出ていく血管は動脈です。' },
    card: { name: '心臓の拍動', cost: 1, type: 'Skill', description: '次に使用するアタックカードの威力を +50% 強化する。' }
  },
  {
    id: 'cir-3', title: '不要物の排出', category: 'circulation', subject: 'biology', status: 'locked', prerequisites: ['cir-2'], quizKey: 'jinzou',
    quiz: { question: 'アンモニアを無毒な尿素に変える器官は？', options: ['腎臓', '心臓', '肝臓', 'すい臓'], answerIndex: 2, explanation: '肝臓で解毒されます。' },
    card: { name: '肝臓の解毒作用', cost: 1, type: 'Skill', description: '自身の状態異常（毒）をすべて解除し、ブロックを 8 獲得する。' }
  },
  // --- NERVE ---
  {
    id: 'ner-1', title: '感覚器官', category: 'nerve', subject: 'biology', status: 'locked', prerequisites: ['cell-1'], quizKey: 'shinkei',
    quiz: { question: '目のつくりで、光の刺激を受け取る部分は？', options: ['水晶体', '虹彩', '網膜', '角膜'], answerIndex: 2, explanation: '網膜に像を結びます。' },
    card: { name: '感覚器官', cost: 0, type: 'Skill', description: '山札からカードを 2 枚引く。' }
  },
  {
    id: 'ner-2', title: '中枢神経と末梢神経', category: 'nerve', subject: 'biology', status: 'locked', prerequisites: ['ner-1'], quizKey: 'shinkei',
    quiz: { question: '脳と脊髄を合わせて何神経という？', options: ['感覚神経', '運動神経', '中枢神経', '末梢神経'], answerIndex: 2, explanation: '全身に指令を出す中心です。' },
    card: { name: '中枢への伝達', cost: 0, type: 'Skill', description: 'エナジーを 2 獲得する。' }
  },
  {
    id: 'ner-3', title: '反射', category: 'nerve', subject: 'biology', status: 'locked', prerequisites: ['ner-2'], quizKey: 'shinkei',
    quiz: { question: '無意識に手を引っ込める反射の際、信号が折り返す場所は？', options: ['大脳', '脊髄', '小脳', '網膜'], answerIndex: 1, explanation: '危険を避けるため脊髄で折り返します。' },
    card: { name: 'せき髄反射', cost: 2, type: 'Skill', description: 'ブロックを 15 獲得。このターン敵が攻撃してきた場合、15 のカウンターダメージを与える。' }
  },
  // --- EVOLUTION ---
  {
    id: 'evo-1', title: '脊椎動物の分類', category: 'evolution', subject: 'biology', status: 'locked', prerequisites: ['cell-2'], quizKey: 'kokkaku_hyohon',
    quiz: { question: '鳥類の特徴は？', options: ['卵生で恒温動物', '胎生で恒温動物', '卵生で変温動物', '胎生で変温動物'], answerIndex: 0, explanation: '卵生で恒温動物です。' },
    card: { name: '脊椎動物の力', cost: 1, type: 'Attack', description: '敵に 10 ダメージを与える。' }
  },
  {
    id: 'evo-2', title: '相同器官', category: 'evolution', subject: 'biology', status: 'locked', prerequisites: ['evo-1'], quizKey: 'kansetsu_kadouiki_kei',
    quiz: { question: 'もとは同じ器官であったと考えられるものを何という？', options: ['痕跡器官', '相似器官', '相同器官', '同化器官'], answerIndex: 2, explanation: '相同器官といいます。' },
    card: { name: '相同器官の共鳴', cost: 3, type: 'Attack', description: 'デッキ枚数 × 6 のダメージを与えるフィニッシュ技。' }
  },

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

];

export const BOSS_DATA: Boss = {
  name: 'バイオ・キメラ：完全生物',
  maxHp: 250,
  pattern: [
    { action: 'starch_armor', value: 30, description: 'デンプン装甲硬化（ブロック+30）' },
    { action: 'attack', value: 15, description: '強打の構え（15 ダメージ）' },
    { action: 'defend', value: 20, description: '防御姿勢（ブロック+20）' },
    { action: 'poison', value: 5, description: '老廃物毒ガス散布（毒を 5 付与）' },
    { action: 'attack', value: 25, description: '渾身の捕食攻撃（25 ダメージ）' }
  ],
};
