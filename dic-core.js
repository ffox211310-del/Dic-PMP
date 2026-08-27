
// dic-core.js v2.1 - 共感を最優先、lastTopicで会話を繋ぐ
class DicCore {
  constructor({ dictionary, profile }) {
    this.dictionary = dictionary;
    this.profile = profile;
    this.processor = new DicProcessor();
    this.recentLeads = [];
    this.recentResponses = new Set();
    this.lastTopic = null; // 直前の話題
    this.lastKnown = null; // 直前の形容詞 (かっこいい など)
    this.onFiller = null;
  }

  async talk(rawText) {
    const t0 = this.processor.normalize(rawText);
    const split = this.processor.splitKnownUnknown(rawText);
    const selfInfo = this.processor.extractSelf(t0);
    const fastMatches = this.processor.fastMatch(t0, this.dictionary);

    // 共感ルートを最優先: 未知語+既知形容詞がある時は辞書より共感を優先
    const hasEmpathySignal = split && split.known;
    if (hasEmpathySignal) {
      if (this.onFiller) this.onFiller('えーっと…');
      const empathyRes = this.buildEmpathyResponse(split, rawText, false);
      if (split.unknown) {
        this.lastTopic = split.unknown;
        this.lastKnown = split.knownBase || split.known;
      }
      if (selfInfo?.isSelf) this.profile.save(selfInfo);
      return empathyRes;
    }

    // lastTopic補完: 好きだよ だけの時
    if (split && !split.unknown && split.known && this.lastTopic) {
      const complemented = { unknown: this.lastTopic, known: split.known, knownBase: split.knownBase };
      const empathyRes = this.buildEmpathyResponse(complemented, rawText, true);
      // lastTopicはそのまま維持
      return empathyRes;
    }

    // 通常の辞書ルート
    let scored = this.processor.scoreWithProfile(fastMatches, this.profile, selfInfo);
    scored = this.processor.filterByContext(scored, this.recentLeads);

    // 辞書にヒットしない & 未知語だけ (例: 小学生のときから) -> 共感
    if ((scored.length === 0 || scored[0].score < 35) && split && split.unknown) {
      const empathyRes = this.buildEmpathyResponse(split, rawText, false);
      this.lastTopic = split.unknown;
      if (selfInfo?.isSelf) this.profile.save(selfInfo);
      return empathyRes;
    }

    let finalCandidates = scored;
    if (finalCandidates.length === 0 || finalCandidates[0].score < 35) {
      finalCandidates = this.pickRandomStrongTopic();
    }

    const response = this.pickRandomResponse(finalCandidates[0], split);
    if (response.leadTopic) {
      this.recentLeads.push(response.leadTopic);
      if (this.recentLeads.length > 5) this.recentLeads.shift();
    }
    if (response.topicToRemember) {
      this.lastTopic = response.topicToRemember;
    }
    if (selfInfo?.isSelf) this.profile.save(selfInfo);
    return response;
  }

  buildEmpathyResponse(split, rawText, isComplemented=false) {
    const { unknown, known, knownBase } = split;
    const k = knownBase || known || '';

    const empathyTemplates = {
      'かっこいい': [
        `${unknown ? unknown + 'は' : ''}カッコいいよね`,
        `${unknown ? unknown + 'って' : 'それって'}確かにカッコいいよね`,
        `${unknown ? unknown + '、' : ''}カッコいいのわかる`
      ],
      'かわいい': [
        `${unknown ? unknown + 'は' : ''}かわいいよね`,
        `${unknown ? unknown + 'って' : 'それ'}かわいいよね、わかる`
      ],
      '好き': [
        `${unknown ? unknown + 'が' : ''}好きなんだね`,
        `${unknown ? unknown + '、' : ''}好きなのいいね`,
        `${unknown ? unknown + 'が' : ''}好きなんだ、覚えておくよ`
      ],
      'すごい': [
        `${unknown ? unknown + 'って' : ''}すごいよね`,
        `${unknown ? unknown + '、' : ''}すごいのわかる`
      ],
      '楽しい': [
        `${unknown ? unknown + 'って' : ''}楽しいよね`,
        `${unknown ? unknown + 'は' : ''}楽しいのいいね`
      ],
      '最高': [
        `${unknown ? unknown + '、' : ''}最高だよね`,
        `${unknown ? unknown + 'って' : ''}最高だよな`
      ],
      'default': [
        unknown ? `${unknown}って${k ? k + 'んだね' : 'いいね'}` : `${k ? k + 'なんだね' : 'そうなんだね'}`,
        unknown ? `${unknown}、${k ? k + 'のわかる' : 'いいね'}` : `そうなんだ、${k}`
      ]
    };

    const followUpTemplates = {
      'かっこいい': [
        '他にもカッコいいのある？',
        'どんなところがカッコいいの？',
        '他にカッコいいと思うのある？',
        '一番カッコいいと思うのはどれ？'
      ],
      'かわいい': [
        '他にもかわいいのある？',
        'どんなところがかわいいの？'
      ],
      '好き': [
        '他にも好きなのある？',
        'どんなところが好きなの？',
        'いつから好きなの？',
        '一番好きなのはどれ？'
      ],
      'すごい': [
        '他にもすごいのある？',
        'どんなところがすごいの？'
      ],
      '楽しい': [
        '他にも楽しいのある？',
        'どんなところが楽しいの？'
      ],
      'default': [
        unknown ? `${unknown}のどんなところが${k ? k : 'いい'}の？` : 'どんな感じなの？',
        '他にもある？',
        '詳しく教えて？'
      ]
    };

    let empathyList = empathyTemplates[k] || empathyTemplates['default'];
    let followList = followUpTemplates[k] || followUpTemplates['default'];

    if (!unknown && isComplemented) {
      empathyList = [`${this.lastTopic}が好きなんだね、覚えておくよ`];
      followList = ['他にも好きなのある？', `${this.lastTopic}のどんなところが好き？`, 'いつから好きなの？'];
    }

    // 小学生のときから のような時間の話は特別扱い
    if (!k && unknown) {
      empathyList = [`${unknown}からなんだね`, `${unknown}、いいね`, `${unknown}なんだね、覚えておくよ`];
      followList = ['それでどうなったの？', '他にもある？', 'どんな感じだったの？'];
    }

    const empathy = empathyList[Math.floor(Math.random()*empathyList.length)];
    const followUp = followList[Math.floor(Math.random()*followList.length)];

    return {
      text: empathy,
      followUp: followUp,
      entry: { id: 'empathy_unknown', score: 90, category: '共感' }, // スコアを上げて最優先に
      leadTopic: 'empathy_unknown',
      topicToRemember: unknown || this.lastTopic,
      isEmpathy: true,
      split
    };
  }

  pickRandomStrongTopic() {
    const strong = this.dictionary.filter(d => d.isStrong);
    let pool = strong.filter(d => !this.recentLeads.includes(d.id));
    if (pool.length === 0) {
      this.recentLeads = [];
      pool = strong;
    }
    pool = [...pool].sort(() => Math.random() - 0.5);
    const top3 = pool.slice(0, 3);
    const chosen = top3[Math.floor(Math.random() * top3.length)];
    return chosen ? [{ ...chosen, score: 60 }] : [];
  }

  pickRandomResponse(entry, split) {
    if (!entry) return { text: 'そうなんだ。もうちょっと教えて？', followUp: 'どんな感じなの？', entry: null, leadTopic: null };
    let available = entry.responses.filter(r => !this.recentResponses.has(r));
    if (available.length === 0) {
      this.recentResponses.clear();
      available = entry.responses;
    }
    let chosen = available[Math.floor(Math.random()*available.length)];
    this.recentResponses.add(chosen);
    if (entry._captured) chosen = chosen.replace('{1}', entry._captured);
    if (split?.unknown && chosen.includes('{1}')) chosen = chosen.replace('{1}', split.unknown);

    const followUps = Array.isArray(entry.followUp) ? entry.followUp : [entry.followUp];
    let fu = followUps[Math.floor(Math.random()*followUps.length)];
    if (split?.unknown && fu && fu.includes('{1}')) fu = fu.replace('{1}', split.unknown);
    return { text: chosen, followUp: fu, entry, leadTopic: entry.id, topicToRemember: split?.unknown || entry.id };
  }
}
