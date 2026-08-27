
// dic-core.js - Dicの根幹部。7段階審査を束ねる
class DicCore {
  constructor({ dictionary, profile }) {
    this.dictionary = dictionary;
    this.profile = profile;
    this.processor = new DicProcessor();
    this.recentLeads = []; // 直近で誘導した話題ID
    this.recentResponses = new Set(); // 同じ返事の連発防止
    this.onFiller = null; // フィラー表示用コールバック
  }

  // メインの会話関数 - ここが何段階も踏む本体
  async talk(rawText) {
    // 0次: 正規化
    const t0 = this.processor.normalize(rawText);

    // 1次: 爆速マッチ
    const fastMatches = this.processor.fastMatch(t0, this.dictionary);

    // 2次: 自己開示審査 (俺は私は)
    const selfInfo = this.processor.extractSelf(t0);

    // フィラー判定: 自己開示 or ヒットなしなら「えーっと」を出す価値あり
    const needsThink = selfInfo?.isSelf || fastMatches.length === 0;
    if (needsThink && this.onFiller) this.onFiller('えーっと…');

    // 3次: プロフィール照合
    let scored = this.processor.scoreWithProfile(fastMatches, this.profile, selfInfo);

    // 4次: 文脈審査 (直近話題のペナルティ)
    scored = this.processor.filterByContext(scored, this.recentLeads);

    // 5次: 得意分野ランダム誘導審査
    // スコアが低い or 暇などの曖昧ワードなら、得意分野からランダムに持ってくる
    let finalCandidates = scored;
    if (finalCandidates.length === 0 || finalCandidates[0].score < 35) {
      finalCandidates = this.pickRandomStrongTopic();
    }

    // 6次: 応答生成 (ランダム + 重複回避)
    const response = this.pickRandomResponse(finalCandidates[0]);

    // 記憶更新
    if (selfInfo?.isSelf) this.profile.save(selfInfo);
    if (response.leadTopic) {
      this.recentLeads.push(response.leadTopic);
      if (this.recentLeads.length > 5) this.recentLeads.shift();
    }

    // 7次以降はWorkerに任せるので、ここで表の処理は終わり
    return response;
  }

  // 5次審査の中身: 同じ質問に持っていかないランダム誘導
  pickRandomStrongTopic() {
    const strong = this.dictionary.filter(d => d.isStrong);
    let pool = strong.filter(d => !this.recentLeads.includes(d.id));
    if (pool.length === 0) {
      this.recentLeads = []; // 全部使ったらリセット
      pool = strong;
    }
    // 完全シャッフル
    pool = [...pool].sort(() => Math.random() - 0.5);
    // 上位3つからランダムで1つ (毎回違う)
    const top3 = pool.slice(0, 3);
    const chosen = top3[Math.floor(Math.random() * top3.length)];
    return chosen ? [{ ...chosen, score: 60 }] : [];
  }

  pickRandomResponse(entry) {
    if (!entry) return { text: 'そうなんだ。もうちょっと教えて？', followUp: null, entry: null, leadTopic: null };
    let available = entry.responses.filter(r => !this.recentResponses.has(r));
    if (available.length === 0) {
      this.recentResponses.clear();
      available = entry.responses;
    }
    let chosen = available[Math.floor(Math.random() * available.length)];
    this.recentResponses.add(chosen);

    // {1} 置換 (例: {1}が好きなんだね → 猫が好きなんだね)
    if (entry.id === 'self_like' && entry._captured) {
      chosen = chosen.replace('{1}', entry._captured);
    }

    const followUps = Array.isArray(entry.followUp) ? entry.followUp : [entry.followUp];
    const fu = followUps[Math.floor(Math.random() * followUps.length)];

    return { text: chosen, followUp: fu, entry, leadTopic: entry.id };
  }
}
