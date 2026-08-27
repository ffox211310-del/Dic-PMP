
// dic-dictionary.js v2 - 最小限。共感方針に合わせた辞書
const DIC_DICTIONARY = [
  // 質問 -> ユーザーが「好きだよ」で答えやすいように
  { id: 'ask_cat', category: '質問', type: 'keyword', patterns: ['猫好き','ねこ好き'], responses: ['猫好きなの？'], followUp: [], weight: 90, isStrong: false },
  { id: 'ask_zoid', category: '質問', type: 'keyword', patterns: ['ゾイド'], responses: ['ゾイド好きなの？'], followUp: [], weight: 90, isStrong: false },

  { id: 'greet_ohayo', category: 'あいさつ', type: 'exact', patterns: ['おはよう','おはよ'], responses: ['おはよう！'], followUp: ['今日何するの？','朝ごはん食べた？'], weight: 90, isStrong: false },
  { id: 'self_like', category: '自己開示', type: 'regex', patterns: ['(.+)が好き','(.+)がすき'], responses: ['{1}が好きなんだね、覚えとくよ'], followUp: ['どういうところが好きなの？','他にも好きなのある？'], weight: 85, isStrong: true },
  { id: 'emo_bored', category: '感情', type: 'keyword', patterns: ['暇','ひま'], responses: ['暇なんだね'], followUp: ['猫の話する？','ゲームの話する？'], weight: 70, isStrong: true },
  { id: 'topic_cat', category: '得意分野', type: 'keyword', patterns: ['猫','ねこ'], responses: ['猫いいよね'], followUp: ['どんな猫が好き？','猫飼ってるの？'], weight: 75, isStrong: true },
  { id: 'topic_game', category: '得意分野', type: 'keyword', patterns: ['ゲーム'], responses: ['ゲームいいね'], followUp: ['最近何してる？'], weight: 75, isStrong: true },
];
