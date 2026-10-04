// A shared four-week cycle, starting October 4, 2026 in the visitor's local date.
const BIMBA_QUESTIONS = [
  [
    { type: 'text', question: 'What’s your dinner plan?', reply: 'That sounds like a lovely plan. I hope you enjoy every bite!' },
    { type: 'choice', question: 'Anything fun today?', yes: 'I love how you find little moments of joy. You deserve them!', no: 'A quiet or hard day is okay too. You don’t have to make every day special. I’m glad you’re here.' },
    { type: 'choice', question: 'Do you want to go to the theater with me?', yes: 'Great! I will buy tickets for us!', no: 'OK, I can find someone else!' }
  ],
  [
    { type: 'text', question: 'What’s one small thing you’re looking forward to?', reply: 'I’m glad you shared that with me. Little things can give us something lovely to look forward to.' },
    { type: 'choice', question: 'Did you get a little time to relax today?', yes: 'Good for you for making space to rest. You deserve a little breathing room.', no: 'You’ve made it this far today. Take a slow breath with me whenever you’re ready.' },
    { type: 'choice', question: 'Would you like to take a little walk with me?', yes: 'Let’s go! Hold my hand and choose our direction.', no: 'That’s okay. We can stay right here and keep each other company.' }
  ],
  [
    { type: 'text', question: 'What song would you like us to listen to?', reply: 'Thanks for sharing your pick. I like getting to know your little world.' },
    { type: 'choice', question: 'Did something make you smile this week?', yes: 'Your smile is such a lovely thing. I’m happy you had that moment!', no: 'Some weeks are heavier than others. There’s no rush to feel better. I’m here for a little company.' },
    { type: 'choice', question: 'Would you like to bake something together?', yes: 'Yes! Let’s imagine a kitchen full of warm cookies. You can choose the flavor!', no: 'No worries. Sharing a little toast sounds lovely too.' }
  ],
  [
    { type: 'text', question: 'What would make tomorrow a little better?', reply: 'Thank you for telling me. I hope tomorrow has a little more room for what you need.' },
    { type: 'choice', question: 'Are you proud of something you did this week?', yes: 'You deserve to notice your progress. I’m cheering for you!', no: 'Getting through the week counts too. You don’t need a big achievement to deserve kindness.' },
    { type: 'choice', question: 'Would you like a cozy movie night with me?', yes: 'It’s a plan! Imagine a soft blanket, a good movie, and a little toast to share.', no: 'That’s okay. We can find another little adventure whenever you feel like it.' }
  ]
];

function bimbaWeek(date = new Date()) {
  const day = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const elapsed = Math.max(0, Math.floor((day - Date.UTC(2026, 9, 4)) / 604800000));
  return elapsed % BIMBA_QUESTIONS.length;
}
