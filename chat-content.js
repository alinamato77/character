// EDIT HERE: weekly note, questions, automatic replies, and mood keywords.
// Publish after editing. Change edition when changing the questions.
// Only question answers are saved, together after the visitor sends their name.
export const chatContent = {
  edition: '2026-10-13-flow-2',
  announcement: "Good morning afternoon evening,\nthis week is so cold!! I don't want to leave my room. But if you ask, I would be happy.. to.. go....",
  signature: 'alina',
  openingButton: 'How about you?',
  questions: [
    { id: 'mood', type: 'text', text: "how's your day?", placeholder: 'write down your mood' },
    { id: 'hangout', type: 'choice', text: 'do you want hang out this week?' },
    { id: 'available-date', type: 'text', text: 'write down your available date', placeholder: 'Friday afternoon.. or Sunday?' }
  ],
  nameQuestion: 'who are you?',
  namePlaceholder: 'your name',
  replies: {
    happy: 'I feel so happy for you',
    supportive: "don't worry I will always be here",
    schedule: 'great! let me schedule for us!',
    declined: 'ok.. maybe next time!',
    sending: 'sending..',
    sent: 'mail sent!',
    error: "it didn't send.. try again?"
  },
  buttons: { next: 'Next', send: 'Send', done: 'Done' },
  // Whole English words, or Chinese phrases. Mixed/unknown moods get the supportive reply.
  moodWords: {
    positive: ['happy','good','great','excited','exciting','amazing','wonderful','lovely','joy','joyful','proud','relaxed','calm','grateful','fun','开心','高兴','快乐','幸福','不错','很好'],
    negative: ['sad','bad','tired','exhausted','stress','stressed','stressful','anxious','worried','lonely','upset','unhappy','sick','awful','terrible','hard','depressed','angry','难过','不开心','不高兴','焦虑','累','烦','糟糕','伤心']
  }
};
