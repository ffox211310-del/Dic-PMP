
// dic-processor.js v2.1 - 未知語分解を改善、うん等のフィラー除去
class DicProcessor {
  constructor() {
    this.knownTokens = [
      'かっこいい','カッコいい','かっこよ','かっこよく',
      'かわいい','可愛い','かわい',
      '好き','すき','大好き','だいすき',
      '嫌い','きらい',
      'すごい','凄い','やばい','ヤバい',
      '楽しい','たのしい','面白い','おもしろい',
      'つまらない','怖い','こわい',
      '嬉しい','うれしい','悲しい','かなしい',
      '疲れた','つかれた','最高','最強','最悪'
    ].sort((a,b) => b.length - a.length);

    this.fillerWords = ['うん','そう','へえ','なるほど','そっか','はい','うんうん','そうそう','まあ'];
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

  cleanUnknown(text) {
    let t = text;
    // 先頭のフィラー除去: うん。好きだよ -> 好きだよ
    for (const f of this.fillerWords) {
      if (t.startsWith(f)) t = t.slice(f.length);
    }
    t = t.replace(/^[ 、,　\.]+/, '').trim();
    t = t.replace(/は|が|だよ|だね|なの|なんだ|だ|です|ます|\?|？|！|!/g, '').trim();
    t = t.replace(/\s+/g, '');
    return t;
  }

  splitKnownUnknown(text) {
    const original = text;
    // フィラー除去したクリーンなテキストで判定
    let cleanedForCheck = text;
    for (const f of this.fillerWords) {
      cleanedForCheck = cleanedForCheck.replace(f, '');
    }

    for (const known of this.knownTokens) {
      if (cleanedForCheck.includes(known)) {
        let unknown = cleanedForCheck.replace(known, '').trim();
        unknown = this.cleanUnknown(unknown);
        if (unknown.length > 0 && unknown.length <= 12) {
          return { unknown, known, knownBase: this.normalizeKnown(known), originalUnknown: unknown };
        }
        if (unknown.length === 0) {
          return { unknown: null, known, knownBase: this.normalizeKnown(known), originalUnknown: null };
        }
      }
    }
    // 知ってる形容詞がなくても、短い名詞っぽければ未知語として扱う (例: 小学生のときから)
    const raw = this.cleanUnknown(text);
    if (raw.length > 0 && raw.length <= 15 && !this.fillerWords.includes(raw)) {
      return { unknown: raw, known: null, knownBase: null, originalUnknown: raw };
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
