
// dic-dictionary.js - 膨大な辞書データ
// このファイルだけをLLMに生成させればいい
// フォーマット: { id, category, type, patterns[], responses[], followUp[]|string, weight, isStrong, memorySlot }

const DIC_DICTIONARY = [
  // あいさつ - exact
  { id: 'greet_ohayo', category: 'あいさつ', type: 'exact', patterns: ['おはよう','おはよ','おはようございます','おはよー'], responses: ['おはよう！','おはよ、よく寝れた？','おはよう、今日もよろしくね'], followUp: ['今日何するの？','朝ごはん食べた？','眠い？'], weight: 90, isStrong: false },
  { id: 'greet_tadaima', category: 'あいさつ', type: 'exact', patterns: ['ただいま','ただいまー','帰った'], responses: ['おかえり！','おかえり、待ってたよ','おかえりなさい、疲れた？'], followUp: ['今日どうだった？','何してたの？'], weight: 90, isStrong: false },
  { id: 'greet_oyasumi', category: 'あいさつ', type: 'exact', patterns: ['おやすみ','寝る','おやすみなさい'], responses: ['おやすみ、いい夢見てね','おやすみ、また明日話そう','ゆっくり休んでね'], followUp: ['明日も話せる？'], weight: 90, isStrong: false },

  // 自己開示 - regex (最重要)
  { id: 'self_like', category: '自己開示', type: 'regex', patterns: ['(.+)が好き','(.+)がすき','(.+)好きなんだ'], responses: ['{1}が好きなんだね、覚えとくよ','{1}好きなのいいね','へえ、{1}が好きなんだ'], followUp: ['どういうところが好きなの？','いつから好きなの？','{1}のどんなところが好き？'], weight: 85, isStrong: true, memorySlot: 'likes' },
  { id: 'self_state', category: '自己開示', type: 'regex', patterns: ['俺は(.+)だ','私は(.+)だ','僕は(.+)なんだ','私は(.+)です'], responses: ['そうなんだ、{1}なんだね','へえ、{1}なんだ、覚えとく','{1}なんだね、教えてくれてありがとう'], followUp: ['{1}ってどんな感じ？','それでどうなの？'], weight: 85, isStrong: false, memorySlot: 'states' },

  // 感情 - keyword
  { id: 'emo_tired', category: '感情', type: 'keyword', patterns: ['疲れ','だる','しんど','ヘトヘト','つかれた'], responses: ['疲れたんだね、よく頑張ったね','お疲れさま、ちょっと休もうか','そっか、疲れちゃったんだ'], followUp: ['今日何してたの？','何かあったの？','少し休む？'], weight: 80, isStrong: true },
  { id: 'emo_happy', category: '感情', type: 'keyword', patterns: ['嬉しい','うれしい','楽しい','たのしい','最高'], responses: ['よかったね！','嬉しそうでこっちまで嬉しいよ','最高じゃん！'], followUp: ['何があったの？','詳しく教えて！'], weight: 80, isStrong: true },
  { id: 'emo_sad', category: '感情', type: 'keyword', patterns: ['悲しい','かなしい','寂しい','さみしい','つらい'], responses: ['そっか、悲しいんだね','大丈夫？話聞くよ','つらい時は無理しないでね'], followUp: ['何があったの？','話してみる？'], weight: 80, isStrong: true },
  { id: 'emo_bored', category: '感情', type: 'keyword', patterns: ['暇','ひま','やることない','退屈'], responses: ['暇なんだね','暇な時はね…','退屈だよね'], followUp: ['猫の話しようか？','ゲームの話する？','音楽でも聴く？','何か面白いことしようか？'], weight: 70, isStrong: true },

  // 日常 - keyword (ランダム誘導の種になる)
  { id: 'daily_cat', category: '日常', type: 'keyword', patterns: ['猫','ねこ','ネコ','にゃん'], responses: ['猫いいよね','猫かわいいよね','にゃーん'], followUp: ['どんな猫が好き？','猫飼ってるの？','猫のどんなところが好き？'], weight: 75, isStrong: true },
  { id: 'daily_game', category: '日常', type: 'keyword', patterns: ['ゲーム','げーむ','ゲーム好き'], responses: ['ゲームいいね','何のゲームしてるの？','ゲーム楽しいよね'], followUp: ['最近何してる？','おすすめある？','一緒にやりたいな'], weight: 75, isStrong: true },
  { id: 'daily_music', category: '日常', type: 'keyword', patterns: ['音楽','曲','歌','おんがく'], responses: ['音楽いいね','どんな音楽聴くの？','音楽って癒されるよね'], followUp: ['おすすめの曲ある？','誰が好き？'], weight: 70, isStrong: true },

  // 困りごと - 逃げずに質問返し
  { id: 'trouble_wakaran', category: '困りごと', type: 'keyword', patterns: ['わからない','わかんない','わからん','意味','どういう'], responses: ['難しいよね','うーん、一緒に考えようか','なるほどね'], followUp: ['どこがわからないの？','もうちょっと教えて？'], weight: 60, isStrong: false },

  // 会話継続 - 低weightで最後の砦
  { id: 'cont_un', category: '会話継続', type: 'exact', patterns: ['うん','そう','へえ','なるほど','そっか'], responses: ['そっかそっか','なるほどね','へえ、そうなんだ'], followUp: ['それでどうなったの？','もうちょっと聞かせて？','でで？'], weight: 30, isStrong: false },

  // ここから先はLLMに生成させる: 同じフォーマットで1000件以上
];

// Node/ブラウザ両対応
if (typeof module !== 'undefined') module.exports = DIC_DICTIONARY;
