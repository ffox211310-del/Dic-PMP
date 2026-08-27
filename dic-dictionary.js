
// dic-dictionary.js - 最小限の辞書。フレームワーク確認用。後でいくらでも足せる
// 形式: { id, category, type, patterns[], responses[], followUp[], weight, isStrong }

const DIC_DICTIONARY = [
  { id: 'greet_ohayo', category: 'あいさつ', type: 'exact', patterns: ['おはよう','おはよ'], responses: ['おはよう！','おはよ、よく寝れた？'], followUp: ['今日何するの？','朝ごはん食べた？'], weight: 90, isStrong: false },
  { id: 'greet_tadaima', category: 'あいさつ', type: 'exact', patterns: ['ただいま','帰った'], responses: ['おかえり！','おかえり、待ってたよ'], followUp: ['今日どうだった？'], weight: 90, isStrong: false },
  { id: 'self_like', category: '自己開示', type: 'regex', patterns: ['(.+)が好き','(.+)がすき'], responses: ['{1}が好きなんだね、覚えとくよ','{1}好きなのいいね'], followUp: ['どういうところが好きなの？','いつから好きなの？','{1}のどんなところ？'], weight: 85, isStrong: true },
  { id: 'self_state', category: '自己開示', type: 'regex', patterns: ['俺は(.+)だ','私は(.+)だ','僕は(.+)なんだ'], responses: ['そうなんだ、{1}なんだね','へえ、{1}なんだ、覚えとく'], followUp: ['{1}ってどんな感じ？'], weight: 85, isStrong: false },
  { id: 'emo_tired', category: '感情', type: 'keyword', patterns: ['疲れ','だる','しんど'], responses: ['疲れたんだね、よく頑張ったね','お疲れさま'], followUp: ['今日何してたの？','何かあったの？','少し休む？'], weight: 80, isStrong: true },
  { id: 'emo_happy', category: '感情', type: 'keyword', patterns: ['嬉しい','楽しい','最高'], responses: ['よかったね！','最高じゃん！'], followUp: ['何があったの？'], weight: 80, isStrong: true },
  { id: 'emo_bored', category: '感情', type: 'keyword', patterns: ['暇','ひま','退屈'], responses: ['暇なんだね'], followUp: ['猫の話する？','ゲームの話する？','音楽の話する？','何か面白いことしようか？'], weight: 70, isStrong: true },
  { id: 'topic_cat', category: '得意分野', type: 'keyword', patterns: ['猫','ねこ'], responses: ['猫いいよね','猫かわいいよね'], followUp: ['どんな猫が好き？','猫飼ってるの？'], weight: 75, isStrong: true },
  { id: 'topic_game', category: '得意分野', type: 'keyword', patterns: ['ゲーム'], responses: ['ゲームいいね','何のゲームしてるの？'], followUp: ['最近何してる？','おすすめある？'], weight: 75, isStrong: true },
  { id: 'topic_music', category: '得意分野', type: 'keyword', patterns: ['音楽','曲'], responses: ['音楽いいね'], followUp: ['おすすめの曲ある？'], weight: 70, isStrong: true },
  { id: 'cont', category: '会話継続', type: 'exact', patterns: ['うん','そう','へえ'], responses: ['そっかそっか','なるほどね'], followUp: ['それでどうなったの？','もうちょっと聞かせて？'], weight: 30, isStrong: false },
];
