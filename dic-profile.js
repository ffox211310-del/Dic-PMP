
// dic-profile.js - ユーザーの自己紹介ベース。保存だけ担当
class DicProfile {
  constructor() {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('dic_profile_v2') : null;
    this.data = saved ? JSON.parse(saved) : {
      name: null,
      pronoun: '私',
      likes: [],
      dislikes: [],
      job: null,
      mood: null,
      states: []
    };
  }
  save(selfInfo) {
    if (!selfInfo?.isSelf) return;
    if (selfInfo.type === 'like' && selfInfo.target) {
      if (!this.data.likes.includes(selfInfo.target)) this.data.likes.push(selfInfo.target);
    }
    if (selfInfo.type === 'state') {
      this.data.states.push(selfInfo.content);
    }
    this.persist();
  }
  setOnboarding({ name, pronoun, likes }) {
    this.data.name = name || this.data.name;
    this.data.pronoun = pronoun || this.data.pronoun;
    if (likes) {
      this.data.likes = likes.split(',').map(s=>s.trim()).filter(Boolean);
    }
    this.persist();
  }
  persist() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('dic_profile_v2', JSON.stringify(this.data));
    }
  }
}
