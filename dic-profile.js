
// dic-profile.js - ユーザーの自己紹介ベース
class DicProfile {
  constructor() {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('dic_profile') : null;
    this.data = saved ? JSON.parse(saved) : {
      name: null,
      pronoun: '私', // 俺/僕/私
      likes: [],
      dislikes: [],
      job: null,
      mood: null,
      states: []
    };
  }

  save(selfInfo) {
    if (!selfInfo) return;
    if (selfInfo.type === 'like' && selfInfo.target) {
      if (!this.data.likes.includes(selfInfo.target)) this.data.likes.push(selfInfo.target);
    }
    if (selfInfo.type === 'state') {
      this.data.states.push(selfInfo.content);
    }
    this.persist();
  }

  setOnboarding({ name, pronoun, likes, dislikes, job, mood }) {
    this.data.name = name;
    this.data.pronoun = pronoun;
    this.data.likes = likes.split(',').map(s => s.trim()).filter(Boolean);
    this.data.dislikes = dislikes.split(',').map(s => s.trim()).filter(Boolean);
    this.data.job = job;
    this.data.mood = mood;
    this.persist();
  }

  persist() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('dic_profile', JSON.stringify(this.data));
    }
  }
}
