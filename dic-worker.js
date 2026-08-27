
// dic-worker.js v2.1 - 裏脳を文脈対応に。猫に飛ばないように
let DICTIONARY = [];
let USER_PROFILE = null;

self.onmessage = async (e) => {
  const { type, payload } = e.data;
  switch(type) {
    case 'init':
      DICTIONARY = payload.dictionary || [];
      USER_PROFILE = payload.profile || null;
      self.postMessage({ type: 'ready', payload: { dictSize: DICTIONARY.length } });
      break;
    case 'deepThink':
      const result = await deepThink(payload);
      if (result.followUpText) {
        self.postMessage({ type: 'deepResult', payload: result });
      }
      break;
  }
};

async function deepThink({ text, profile, recentLeads, fastResult, lastTopic, lastKnown, split }) {
  await sleep(300 + Math.random()*400); // 少し短く

  // 重要: 裏は表の共感を邪魔しない。同じ話題を深掘りするだけ
  const topic = split?.unknown || lastTopic || fastResult?.topicToRemember;
  const known = split?.knownBase || split?.known || lastKnown;

  if (!topic) {
    // 話題がない時は何も言わない (猫に飛ばない)
    return { originalText: text, followUpText: null, suggestionId: null };
  }

  // 話題がある時は、その話題を深掘りする質問を作る
  const deepQuestions = {
    'かっこいい': [
      `${topic}のどのあたりが一番カッコいいと思う？`,
      `${topic}で一番カッコいいのってどれ？`,
      `他にも${topic}みたいにカッコいいのある？`
    ],
    '好き': [
      `${topic}のどんなところが好きなの？`,
      `${topic}っていつから好きなの？`,
      `${topic}以外にも好きなのある？`
    ],
    'かわいい': [
      `${topic}のどんなところがかわいいの？`,
      `${topic}ってどこが一番かわいいと思う？`
    ],
    'default': [
      `${topic}についてもっと教えて？`,
      `${topic}のどんなところがいいの？`,
      `他にも${topic}みたいなのある？`
    ]
  };

  let questions = deepQuestions[known] || deepQuestions['default'];
  
  // 同じ質問の連発防止
  let q = questions[Math.floor(Math.random()*questions.length)];
  
  // 既に表が同じ質問をしてたら裏は何も言わない
  if (fastResult?.followUp && fastResult.followUp === q) {
    return { originalText: text, followUpText: null, suggestionId: null };
  }

  return {
    originalText: text,
    followUpText: q,
    suggestionId: topic,
    topic,
    known
  };
}

function pickRandom(arr) {
  if (!arr) return '';
  const a = Array.isArray(arr) ? arr : [arr];
  return a[Math.floor(Math.random()*a.length)];
}
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
