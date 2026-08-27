
// dic-core.js v2 - 共感方針。未知語でも会話を続ける
class DicCore {
  constructor({ dictionary, profile }) {
    this.dictionary = dictionary;
    this.profile = profile;
    this.processor = new DicProcessor();
    this.recentLeads = [];
    this.recentResponses = new Set();
    this.lastTopic = null; // 会話の流れ: 直前の話題 (例: 猫)
    this.onFiller = null;
  }

  async talk(rawText) {
    const t0 = this.processor.normalize(rawText);
    const split = this.processor.splitKnownUnknown(rawText); // 未知語分解
    const selfInfo = this.processor.extractSelf(t0);
    const fastMatches = this.processor.fastMatch(t0, this.dictionary);

    const needsThink = selfInfo?.isSelf || fastMatches.length === 0 || (split && split.unknown);
    if (needsThink && this.onFiller) this.onFiller('えーっと…');

    // 1. 辞書マッチが強ければそれを優先
    let scored = this.processor.scoreWithProfile(fastMatches, this.profile, selfInfo);
    scored = this.processor.filterByContext(scored, this.recentLeads);

    // 2. 未知語共感ルート (辞書にない or スコア低い時)
    if ((scored.length === 0 || scored[0].score < 40) && split) {
      const empathyRes = this.buildEmpathyResponse(split, rawText);
      if (empathyRes) {
        // lastTopicを更新
        if (split.unknown) this.lastTopic = split.unknown;
        if (selfInfo?.isSelf) this.profile.save(selfInfo);
        return empathyRes;
      }
    }

    // 3. lastTopicを使った補完 (好きだよ だけの時)
    if (split && !split.unknown && split.known && this.lastTopic) {
      // 例: Dic「猫好きなの？」-> ユーザー「好きだよ」-> lastTopic=猫 を使って共感
      const complemented = { unknown: this.lastTopic, known: split.known, knownBase: split.knownBase };
      const empathyRes = this.buildEmpathyResponse(complemented, rawText, true);
      if (empathyRes) {
        return empathyRes;
      }
    }

    // 4. 通常の辞書応答 (共感 + 話題ふり)
    let finalCandidates = scored;
    if (finalCandidates.length === 0 || finalCandidates[0].score < 35) {
      finalCandidates = this.pickRandomStrongTopic();
    }

    const response = this.pickRandomResponse(finalCandidates[0], split);
    if (response.leadTopic) {
      this.recentLeads.push(response.leadTopic);
      if (this.recentLeads.length > 5) this.recentLeads.shift();
      this.lastTopic = response.leadTopic.replace(/topic_|daily_|greet_/g, '') || this.lastTopic;
    }
    if (response.topicToRemember) {
      this.lastTopic = response.topicToRemember;
    }
    if (selfInfo?.isSelf) this.profile.save(selfInfo);
    return response;
  }

  // 共感テンプレート生成 - 方針: 共感 -> 話題ふり
  buildEmpathyResponse(split, rawText, isComplemented=false) {
    const { unknown, known, knownBase } = split;
    const k = knownBase || known || '';

    // テンプレート
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
        `${unknown ? unknown + '、' : ''}好きなのいいね`
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
        '他にカッコいいと思うのある？'
      ],
      'かわいい': [
        '他にもかわいいのある？',
        'どんなところがかわいいの？'
      ],
      '好き': [
        '他にも好きなのある？',
        'どんなところが好きなの？',
        'いつから好きなの？'
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
        '他にもある？',
        'どんな感じなの？',
        '詳しく教えて？'
      ]
    };

    let empathyList = empathyTemplates[k] || empathyTemplates['default'];
    let followList = followUpTemplates[k] || followUpTemplates['default'];

    // 未知語が完全にない (好きだよだけ) で補完された場合
    if (!unknown && isComplemented) {
      empathyList = [`${this.lastTopic}が好きなんだね、覚えておくよ`];
      followList = ['他にも好きなのある？', `${this.lastTopic}のどんなところが好き？`];
    }

    const empathy = empathyList[Math.floor(Math.random()*empathyList.length)];
    const followUp = followList[Math.floor(Math.random()*followList.length)];

    return {
      text: empathy,
      followUp: followUp,
      entry: { id: 'empathy_unknown', score: 70, category: '共感' },
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

    if (entry._captured) {
      chosen = chosen.replace('{1}', entry._captured);
    }
    // 未知語があればテンプレートに埋める
    if (split?.unknown && chosen.includes('{1}')) {
      chosen = chosen.replace('{1}', split.unknown);
    }

    const followUps = Array.isArray(entry.followUp) ? entry.followUp : [entry.followUp];
    let fu = followUps[Math.floor(Math.random()*followUps.length)];
    if (split?.unknown && fu && fu.includes('{1}')) fu = fu.replace('{1}', split.unknown);

    return { text: chosen, followUp: fu, entry, leadTopic: entry.id, topicToRemember: split?.unknown || entry.id };
  }
}
