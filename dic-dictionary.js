
// dic-dictionary.js v2.1 - 共感を邪魔しない最小限辞書
// ask_* は削除、共感ルートを優先させる

const DIC_DICTIONARY = [
  { id: 'greet_ohayo', category: 'あいさつ', type: 'exact', patterns: ['おはよう','おはよ'], responses: ['おはよう！'], followUp: ['今日何するの？'], weight: 90, isStrong: false },
  { id: 'greet_tadaima', category: 'あいさつ', type: 'exact', patterns: ['ただいま','帰った'], responses: ['おかえり！'], followUp: ['今日どうだった？'], weight: 90, isStrong: false },
  // 自己開示は残すが、共感ルートよりスコア低めに
  { id: 'self_like', category: '自己開示', type: 'regex', patterns: ['(.+)が好き','(.+)がすき'], responses: ['{1}が好きなんだね、覚えとくよ'], followUp: ['どういうところが好きなの？'], weight: 60, isStrong: false },
  { id: 'emo_bored', category: '感情', type: 'keyword', patterns: ['暇','ひま','退屈'], responses: ['暇なんだね'], followUp: ['何か面白いことしようか？'], weight: 70, isStrong: true },
  { id: 'topic_cat', category: '得意分野', type: 'keyword', patterns: ['猫','ねこ'], responses: ['猫いいよね'], followUp: ['どんな猫が好き？'], weight: 50, isStrong: true },
  { id: 'cont', category: '会話継続', type: 'exact', patterns: ['うん','そう','へえ'], responses: ['そっかそっか','なるほどね'], followUp: ['それでどうなったの？'], weight: 20, isStrong: false },
];
