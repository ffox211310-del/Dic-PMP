
// dic-processor.js - 審査で使う部品だけ。状態を持たない
class DicProcessor {
  normalize(text) {
    return text.toLowerCase()
      .replace(/[!?！？。、「」]/g, '')
      .replace(/ー+/g, '')
      .trim();
  }

  // 0次審査の次: 自己開示検出
  extractSelf(text) {
    const m = text.match(/^(?:俺|おれ|僕|ぼく|私|わたし|あたし|自分|うち)は(.+)/);
    if (!m) return null;
    const content = m[1];
    const like = content.match(/(.+?)が(.+?)好き/);
    if (like) return { isSelf: true, type: 'like', target: like[1].replace(/が$/, ''), raw: content };
    return { isSelf: true, type: 'state', content, raw: content };
  }

  // 1次審査: 爆速マッチ
  fastMatch(text, dict) {
    return dict.map(entry => {
      let score = 0;
      for (const p of entry.patterns) {
        if (entry.type === 'exact' && text === p) score += 100;
        if (entry.type === 'keyword' && text.includes(p)) score += 50 + p.length*2;
        if (entry.type === 'regex') {
          try { if (new RegExp(p).test(text)) score += 80; } catch(e) {}
        }
      }
      score *= (entry.weight / 50);
      return { ...entry, score };
    }).filter(e => e.score > 0).sort((a,b) => b.score - a.score);
  }

  // 3次: プロフィール加算
  scoreWithProfile(matches, profile, selfInfo) {
    const likes = profile.data.likes || [];
    return matches.map(m => {
      let bonus = 0;
      if (selfInfo?.isSelf) bonus += 30;
      if (likes.some(l => m.patterns.some(p => p.includes(l) || l.includes(p)))) bonus += 20;
      return { ...m, score: m.score + bonus };
    }).sort((a,b) => b.score - a.score);
  }

  // 4次: 文脈 (直近の話題はペナルティ)
  filterByContext(matches, recentLeads) {
    return matches.map(m => {
      if (recentLeads.includes(m.id)) return { ...m, score: m.score * 0.4 };
      return m;
    }).sort((a,b) => b.score - a.score);
  }
}
