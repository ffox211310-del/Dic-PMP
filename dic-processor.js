
// dic-processor.js v2 - 未知語を共感で返す
class DicProcessor {
  constructor() {
    // 知ってる語 (形容詞・感情) - これがあれば未知語でも会話になる
    this.knownTokens = [
      'かっこいい','カッコいい','かっこよ','かっこよく',
      'かわいい','可愛い','かわい',
      '好き','すき','大好き','だいすき',
      '嫌い','きらい',
      'すごい','凄い','やばい','ヤバい',
      '楽しい','たのしい','面白い','おもしろい',
      'つまらない','怖い','こわい',
      '嬉しい','うれしい','悲しい','かなしい',
      '疲れた','つかれた','最高','最強','最悪','かっこいいよね','かわいいよね'
    ].sort((a,b) => b.length - a.length); // 長い順にマッチさせる
  }

  normalize(text) {
    return text.toLowerCase()
      .replace(/[!?！？。、「」]/g, '')
      .replace(/ー+/g, '')
      .trim();
  }

  extractSelf(text) {
    const m = text.match(/^(?:俺|おれ|僕|ぼく|私|わたし|あたし|自分|うち)は(.+)/);
    if (!m) return null;
    const content = m[1];
    const like = content.match(/(.+?)が(.+?)好き/);
    if (like) return { isSelf: true, type: 'like', target: like[1].replace(/が$/, ''), raw: content };
    return { isSelf: true, type: 'state', content, raw: content };
  }

  // 未知語分解: ゾイドかっこいい -> { unknown: 'ゾイド', known: 'かっこいい' }
  splitKnownUnknown(text) {
    const raw = text.replace(/は|が|だよ|だね|なの|なんだ|だ|です|ます|\?|？/g, '').trim();
    for (const known of this.knownTokens) {
      if (text.includes(known)) {
        let unknown = text.replace(known, '').trim();
        // はがとか除去
        unknown = unknown.replace(/は|が|が好き|がすき|だよ|だね|なの|？|\?|！|!/g, '').trim();
        unknown = unknown.replace(/\s+/g, '');
        if (unknown.length > 0 && unknown.length <= 10) {
          return { unknown, known, knownBase: this.normalizeKnown(known) };
        }
        // 未知語なしのパターン (好きだよ だけ) の場合
        if (unknown.length === 0) {
          return { unknown: null, known, knownBase: this.normalizeKnown(known) };
        }
      }
    }
    // 完全未知語 (辞書にない名詞だけ) の場合も一応拾う
    if (raw.length > 0 && raw.length <= 8) {
      // 既知トークンが一つもないけど、短い名詞っぽい -> 未知語として扱う
      return { unknown: raw, known: null, knownBase: null };
    }
    return null;
  }

  normalizeKnown(known) {
    const map = {
      'かっこいい': 'かっこいい', 'カッコいい': 'かっこいい', 'かっこよ': 'かっこいい',
      'かわいい': 'かわいい', '可愛い': 'かわいい',
      '好き': '好き', 'すき': '好き', '大好き': '好き', 'だいすき': '好き',
      'すごい': 'すごい', '凄い': 'すごい', 'やばい': 'すごい', 'ヤバい': 'すごい',
      '楽しい': '楽しい', 'たのしい': '楽しい', '面白い': '楽しい', 'おもしろい': '楽しい',
      '最高': '最高', '最強': '最高'
    };
    for (const k in map) if (known.includes(k)) return map[k];
    return known;
  }

  fastMatch(text, dict) {
    return dict.map(entry => {
      let score = 0;
      let captured = null;
      for (const p of entry.patterns) {
        if (entry.type === 'exact' && text === p) score += 100;
        if (entry.type === 'keyword' && text.includes(p)) score += 50 + p.length*2;
        if (entry.type === 'regex') {
          try {
            const re = new RegExp(p);
            const m = text.match(re);
            if (m) { score += 80; captured = m[1] || null; }
          } catch(e) {}
        }
      }
      score *= (entry.weight / 50);
      return { ...entry, score, _captured: captured };
    }).filter(e => e.score > 0).sort((a,b) => b.score - a.score);
  }

  scoreWithProfile(matches, profile, selfInfo) {
    const likes = profile.data.likes || [];
    return matches.map(m => {
      let bonus = 0;
      if (selfInfo?.isSelf) bonus += 30;
      if (likes.some(l => m.patterns.some(p => p.includes(l) || l.includes(p)))) bonus += 15;
      return { ...m, score: m.score + bonus };
    }).sort((a,b) => b.score - a.score);
  }

  filterByContext(matches, recentLeads) {
    return matches.map(m => {
      if (recentLeads.includes(m.id)) return { ...m, score: m.score * 0.4 };
      return m;
    }).sort((a,b) => b.score - a.score);
  }
}
