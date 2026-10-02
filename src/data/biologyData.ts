export type Category = 'cell' | 'digestion' | 'circulation' | 'nerve' | 'evolution';
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
  status: Status;
  prerequisites: string[];
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
];

export const INITIAL_NODES: Node[] = [
  // --- CELL ---
  {
    id: 'cell-1', title: '細胞の基本構造', category: 'cell', status: 'unlocked', prerequisites: [],
    quiz: { question: '細胞の中で、生命活動に必要なエネルギーを取り出すはたらきをしている部分はどれ？', options: ['核', '細胞膜', 'ミトコンドリア', '葉緑体'], answerIndex: 2, explanation: 'ミトコンドリアで酸素を使って養分を分解し、エネルギーを取り出す「細胞の呼吸」が行われます。' },
    card: { name: '細胞の基本', cost: 1, type: 'Attack', description: '敵に 8 ダメージを与える。' }
  },
  {
    id: 'cell-2', title: '植物と動物の細胞', category: 'cell', status: 'locked', prerequisites: ['cell-1'],
    quiz: { question: '植物細胞にはあるが、動物細胞にはない作りの組み合わせで正しいものは？', options: ['核・細胞膜', '葉緑体・細胞壁', '細胞質・液胞', 'ミトコンドリア・核'], answerIndex: 1, explanation: '植物の細胞には、光合成を行う「葉緑体」と、からだを支える丈夫な「細胞壁」があります。' },
    card: { name: '細胞壁展開', cost: 2, type: 'Skill', description: 'ブロックを 12 獲得する。' }
  },
  {
    id: 'cell-3', title: '細胞呼吸の真髄', category: 'cell', status: 'locked', prerequisites: ['dig-3', 'cir-2'],
    quiz: { question: '細胞呼吸によってエネルギーを取り出す際、養分と酸素から発生する不要物の正しい組み合わせは？', options: ['二酸化炭素と水', '酸素とアンモニア', 'デンプンと酸素', '二酸化炭素と尿素'], answerIndex: 0, explanation: '細胞呼吸では、養分が酸素で分解されてエネルギーが発生し、同時に二酸化炭素と水ができます。消化と循環の知識がここで繋がります！' },
    card: { name: '細胞呼吸', cost: 2, type: 'Power', description: '戦闘終了まで、毎ターン開始時のドロー枚数を +1 する。' }
  },
  // --- DIGESTION ---
  {
    id: 'dig-1', title: 'だ液と消化酵素', category: 'digestion', status: 'locked', prerequisites: ['cell-1'],
    quiz: { question: 'だ液に含まれる消化酵素「アミラーゼ」が分解する栄養分は何？', options: ['タンパク質', '脂肪', 'デンプン', 'ビタミン'], answerIndex: 2, explanation: 'だ液中のアミラーゼは、デンプンを麦芽糖などの糖に分解します。' },
    card: { name: 'だ液アミラーゼ', cost: 1, type: 'Attack', description: '敵に 12 ダメージを与える。敵が「デンプン装甲」を持つ場合、装甲を破壊して2倍ダメージ！' }
  },
  {
    id: 'dig-2', title: '胃と腸の働き', category: 'digestion', status: 'locked', prerequisites: ['dig-1'],
    quiz: { question: '胃液に含まれる消化酵素「ペプシン」が主に分解する栄養分はどれ？', options: ['デンプン', '脂肪', 'ブドウ糖', 'タンパク質'], answerIndex: 3, explanation: 'ペプシンはタンパク質の消化を助けます。また、胃液は強い酸性で殺菌作用もあります。' },
    card: { name: '胃液ペプシン', cost: 2, type: 'Attack', description: '敵に 18 ダメージを与え、2ターンの「弱体化（ダメージ25%減）」を付与する。' }
  },
  {
    id: 'dig-3', title: '小腸での吸収', category: 'digestion', status: 'locked', prerequisites: ['dig-2'],
    quiz: { question: '小腸の壁にある、栄養分を効率よく吸収するための無数の小さな突起を何という？', options: ['繊毛', '柔毛', '肺胞', '根毛'], answerIndex: 1, explanation: '柔毛（じゅうもう）があることで小腸の内側の表面積が非常に大きくなり、効率よく栄養分を吸収できます。' },
    card: { name: '小腸の柔毛', cost: 1, type: 'Skill', description: 'HPを 10 回復し、次のターンのドロー枚数を +1 する。' }
  },
  // --- CIRCULATION ---
  {
    id: 'cir-1', title: '肺胞とガス交換', category: 'circulation', status: 'locked', prerequisites: ['cell-1'],
    quiz: { question: '気管支の先にある小さなふくろ（肺胞）が多いことの利点は何？', options: ['空気を多くためられる', '表面積が大きくなりガス交換が効率よく行える', '肺を軽くできる', 'ほこりを防げる'], answerIndex: 1, explanation: '小腸の柔毛と同じく、無数の肺胞によって表面積が大きくなり、酸素と二酸化炭素の交換が速やかに行われます。' },
    card: { name: '肺胞のガス交換', cost: 1, type: 'Power', description: '戦闘終了まで、毎ターンの開始時エナジー回復量が +1 される。' }
  },
  {
    id: 'cir-2', title: '心臓と血液の循環', category: 'circulation', status: 'locked', prerequisites: ['cir-1'],
    quiz: { question: '心臓から肺へ向かう血液が通る血管を何という？', options: ['肺動脈', '肺静脈', '大動脈', '大静脈'], answerIndex: 0, explanation: '「心臓から出ていく血管」はすべて動脈です。肺動脈には、二酸化炭素を多く含む「静脈血」が流れています。' },
    card: { name: '心臓の拍動', cost: 1, type: 'Skill', description: '次に使用するアタックカードの威力を +50% 強化する。' }
  },
  {
    id: 'cir-3', title: '不要物の排出', category: 'circulation', status: 'locked', prerequisites: ['cir-2'],
    quiz: { question: '有害なアンモニアを、害の少ない尿素に変えるはたらきをする器官はどこ？', options: ['腎臓', '心臓', '肝臓', 'すい臓'], answerIndex: 2, explanation: '肝臓でアンモニアが尿素に変えられ、その後、腎臓で血液中からこし出されて尿として排出されます。' },
    card: { name: '肝臓の解毒作用', cost: 1, type: 'Skill', description: '自身の状態異常（毒）をすべて解除し、ブロックを 8 獲得する。' }
  },
  // --- NERVE ---
  {
    id: 'ner-1', title: '感覚器官', category: 'nerve', status: 'locked', prerequisites: ['cell-1'],
    quiz: { question: '目のつくりで、光の刺激を受け取る細胞が集まっている部分（スクリーンのはたらき）を何という？', options: ['水晶体', '虹彩', '網膜', '角膜'], answerIndex: 2, explanation: 'レンズ（水晶体）を通った光は網膜に像を結び、その刺激が視神経を通って脳に伝わります。' },
    card: { name: '感覚器官', cost: 0, type: 'Skill', description: '山札からカードを 2 枚引く。' }
  },
  {
    id: 'ner-2', title: '中枢神経と末梢神経', category: 'nerve', status: 'locked', prerequisites: ['ner-1'],
    quiz: { question: '脳と脊髄を合わせて何神経という？', options: ['感覚神経', '運動神経', '中枢神経', '末梢神経'], answerIndex: 2, explanation: '脳と脊髄は全身に指令を出す中心となるため「中枢神経」と呼ばれます。そこから枝分かれする神経が「末梢神経」です。' },
    card: { name: '中枢への伝達', cost: 0, type: 'Skill', description: 'エナジーを 2 獲得する。' }
  },
  {
    id: 'ner-3', title: '反射', category: 'nerve', status: 'locked', prerequisites: ['ner-2'],
    quiz: { question: '熱いものに触れたとき、無意識に手を引っ込める「反射」の際、信号はどこを折り返して運動神経へ伝わる？', options: ['大脳', '脊髄', '小脳', '網膜'], answerIndex: 1, explanation: '危険から身を守るため、大脳を経由せず脊髄で折り返して瞬時に反応を返すのが反射の特徴です。' },
    card: { name: 'せき髄反射', cost: 2, type: 'Skill', description: 'ブロックを 15 獲得。このターン敵が攻撃してきた場合、15 のカウンターダメージを与える。' }
  },
  // --- EVOLUTION ---
  {
    id: 'evo-1', title: '脊椎動物の分類', category: 'evolution', status: 'locked', prerequisites: ['cell-2'],
    quiz: { question: 'ハトやペンギンなどの鳥類の特徴として正しいものは？', options: ['卵生で恒温動物', '胎生で恒温動物', '卵生で変温動物', '胎生で変温動物'], answerIndex: 0, explanation: '鳥類は卵生（卵を産む）であり、周囲の温度が変わっても体温を一定に保つ恒温動物です。' },
    card: { name: '脊椎動物の力', cost: 1, type: 'Attack', description: '敵に 10 ダメージを与える。' }
  },
  {
    id: 'evo-2', title: '相同器官', category: 'evolution', status: 'locked', prerequisites: ['evo-1'],
    quiz: { question: '現在の形やはたらきは違うが、もとは同じ器官であったと考えられるものを何という？', options: ['痕跡器官', '相似器官', '相同器官', '同化器官'], answerIndex: 2, explanation: 'カエルの前肢、鳥の翼、ヒトの腕などのように、基本的な骨格が同じで、進化の過程で用途が分かれた器官を相同器官といいます。' },
    card: { name: '相同器官の共鳴', cost: 3, type: 'Attack', description: '習得済みのスキル数（デッキ枚数） × 6 のダメージを与えるフィニッシュ技。' }
  }
];

export const BOSS_DATA: Boss = {
  name: 'バイオ・キメラ：完全生物',
  maxHp: 250, // カードバトラーとしてのバランス調整
  pattern: [
    { action: 'starch_armor', value: 30, description: 'デンプン装甲硬化（ブロック+30）' },
    { action: 'attack', value: 15, description: '強打の構え（15 ダメージ）' },
    { action: 'defend', value: 20, description: '防御姿勢（ブロック+20）' },
    { action: 'poison', value: 5, description: '老廃物毒ガス散布（毒を 5 付与）' },
    { action: 'attack', value: 25, description: '渾身の捕食攻撃（25 ダメージ）' }
  ],
};
