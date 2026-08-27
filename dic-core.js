
// PowerMatchingPrompt Dic - コアエンジン (dic-core.js)
// 役割: 7段階審査のパイプライン制御、フィラー、ランダム誘導の司令塔
class DicCore {
  constructor({ dictionary, profile }) {
    this.dictionary = dictionary; // dic-dictionary.js から注入
    this.profile = profile; // dic-profile.js
    this.recentLeads = []; // 直近で誘導した話題の履歴 (ランダム化のため)
    this.recentResponses = new Set(); // 同じ返事の連発防止
    this.processor = new DicProcessor(); // dic-pattern-processor.js
  }

  async talk(rawText) {
    const t0 = this.processor.normalize(rawText);
    
    // 1次: 爆速マッチ
    const fastMatches = this.processor.fastMatch(t0, this.dictionary);
    const top = fastMatches[0];

    // フィラー判定: 2次以降が重そうなら先に出す
    const needsThink = (top?.category === '自己開示' || fastMatches.length === 0);
    if (needsThink) this.onFiller?.('えーっと…');

    // 2次: 自己開示
    const selfInfo = this.processor.extractSelf(t0);

    // 3次: プロフィール照合
    const profileScore = this.processor.scoreWithProfile(fastMatches, this.profile, selfInfo);

    // 4次: 文脈チェック
    const contextFiltered = this.processor.filterByContext(profileScore, this.recentLeads);

    // 5次: 得意分野誘導 (ここでランダム化)
    let finalCandidates = contextFiltered;
    if (finalCandidates.length === 0 || finalCandidates[0].score < 30) {
      finalCandidates = this.pickRandomStrongTopic(t0);
    }

    // 6次: 応答生成 (ランダム + 重複回避)
    const response = this.pickRandomResponse(finalCandidates[0]);

    // 記憶更新
    if (selfInfo?.isSelf) {
      this.profile.save(selfInfo);
    }
    if (response.leadTopic) {
      this.recentLeads.push(response.leadTopic);
      if (this.recentLeads.length > 5) this.recentLeads.shift(); // 5件まで記憶
    }

    return response;
  }

  // 同じ質問に引っ張らないためのランダム誘導
  pickRandomStrongTopic(text) {
    const strong = this.dictionary.filter(d => d.isStrong); // 得意分野フラグ
    // 直近で使った話題は除外
    let pool = strong.filter(d => !this.recentLeads.includes(d.id));
    if (pool.length === 0) {
      this.recentLeads = []; // リセット
      pool = strong;
    }
    // 完全ランダムではなく、ユーザーのlikesに近いものを優先しつつランダム
    const liked = this.profile.data.likes || [];
    pool = pool.sort(() => Math.random() - 0.5); // シャッフル
    pool = pool.sort((a,b) => {
      const aLiked = liked.some(l => a.patterns.some(p => l.includes(p) || p.includes(l))) ? 1 : 0;
      const bLiked = liked.some(l => b.patterns.some(p => l.includes(p) || p.includes(l))) ? 1 : 0;
      return bLiked - aLiked; // 好きなものが少し優先、でもシャッフルでランダム
    });
    // 上位3つからランダムで1つ
    const top3 = pool.slice(0,3);
    return [top3[Math.floor(Math.random()*top3.length)]];
  }

  pickRandomResponse(entry) {
    if (!entry) return { text: 'そうなんだ。もうちょっと教えて？', followUp: null };
    // 同じ返事を連続で使わない
    let available = entry.responses.filter(r => !this.recentResponses.has(r));
    if (available.length === 0) {
      this.recentResponses.clear();
      available = entry.responses;
    }
    const chosen = available[Math.floor(Math.random()*available.length)];
    this.recentResponses.add(chosen);
    // followUpもランダム
    const followUps = Array.isArray(entry.followUp) ? entry.followUp : [entry.followUp];
    const fu = followUps[Math.floor(Math.random()*followUps.length)];
    return { text: chosen, followUp: fu, leadTopic: entry.id, entry };
  }
}
