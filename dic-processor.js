
// dic-pattern-processor.js - パターン処理部
class DicProcessor {
  normalize(text) {
    return text.toLowerCase()
      .replace(/[!?！？。、「」]/g, '')
      .replace(/ー+/g, '')
      .trim();
  }

  extractSelf(text) {
    const selfRegex = /^(?:俺|おれ|僕|ぼく|私|わたし|あたし|自分|うち)は(.+)/;
    const m = text.match(selfRegex);
    if (!m) return null;
    const content = m[1];
    const like = content.match(/(.+?)が(.+?)好き/);
    if (like) return { isSelf: true, type: 'like', target: like[1].replace(/が$/, ''), raw: content };
    return { isSelf: true, type: 'state', content, raw: content };
  }

  fastMatch(text, dict) {
    // 将来はAho-Corasickに置き換え可能なシンプル実装
    return dict.map(entry => {
      let score = 0;
      for (const p of entry.patterns) {
        if (entry.type === 'exact' && text === p) score += 100;
        if (entry.type === 'keyword' && text.includes(p)) score += 50 + p.length*2;
        if (entry.type === 'regex') {
          try { if (new RegExp(p).test(text)) score += 80; } catch(e) {}
        }
        if (entry.type === 'contains' && text.toLowerCase().includes(p.toLowerCase())) score += 45;
      }
      score *= (entry.weight / 50);
      return { ...entry, score };
    }).filter(e => e.score > 0).sort((a,b) => b.score - a.score);
  }

  scoreWithProfile(matches, profile, selfInfo) {
    const likes = profile.data.likes || [];
    return matches.map(m => {
      let bonus = 0;
      if (selfInfo?.isSelf) bonus += 30;
      if (likes.some(l => m.patterns.some(p => p.includes(l) || l.includes(p)))) bonus += 20;
      return { ...m, score: m.score + bonus };
    }).sort((a,b) => b.score - a.score);
  }

  filterByContext(matches, recentLeads) {
    // 直近で使った話題のスコアを少し下げる
    return matches.map(m => {
      if (recentLeads.includes(m.id)) return { ...m, score: m.score * 0.5 };
      return m;
    }).sort((a,b) => b.score - a.score);
  }
}
