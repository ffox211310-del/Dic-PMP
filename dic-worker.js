
// dic-worker.js - 裏脳。時間かけていい処理専用
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
      self.postMessage({ type: 'deepResult', payload: result });
      break;
    case 'cronyGO':
      const cr = await callCronyGO(payload.text);
      self.postMessage({ type: 'cronyResult', payload: cr });
      break;
  }
};

async function deepThink({ text, profile, recentLeads, fastResult }) {
  await sleep(400 + Math.random()*600); // わざと時間をかける
  const strong = DICTIONARY.filter(d => d.isStrong);
  let pool = strong.filter(d => !recentLeads?.includes(d.id));
  if (pool.length === 0) pool = strong;
  pool = [...pool].sort(() => Math.random() - 0.5);
  const top = pool[0];
  return {
    originalText: text,
    followUpText: top ? `そういえば、${pickRandom(top.followUp)}` : null,
    suggestionId: top?.id
  };
}

async function callCronyGO(text) {
  await sleep(1200);
  return { text: `（CronyGO裏思考: "${text}" を深く考えたよ）` };
}

function pickRandom(arr) {
  if (!arr) return '';
  const a = Array.isArray(arr) ? arr : [arr];
  return a[Math.floor(Math.random()*a.length)];
}
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
