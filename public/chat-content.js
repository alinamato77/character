// EDIT THIS FILE for weekly announcements, questions, and companion replies.
// After editing, publish the website to make your changes live.
// Change edition whenever you edit questions (e.g. 2026-10-20).
// Keep question IDs unique. type: 'chat' is NEVER saved; 'text' / 'choice' answers are saved.
export const chatContent = {
  edition: '2026-10-13',
  announcement: "Good morning afternoon evening,\nthis week is so cold!! I don't want to leave my room. But if you ask, I would be happy.. to.. go....",
  signature: 'alina',
  openingButton: 'How about you?',
  // Conversation order: mix little companion moments with questions.
  conversation: [
    { id: 'day', type: 'text', topic: 'Your day',
      text: 'How has your day been? Anything you want to get off your chest?',
      reply: 'Thank you for telling me. I’m here to keep you company, whatever kind of day it’s been.' },
    { type: 'chat', text: 'I’m imagining a warm patch of sunshine and a blanket big enough for both of us.', button: 'Stay a little' },
    { id: 'emotion', type: 'text', topic: 'Your feelings',
      text: 'What feeling has been following you around today?',
      reply: 'You don’t have to turn that feeling into something positive for me. Thank you for sharing it.' },
    { type: 'chat', text: 'We can take this slowly. There’s no perfect thing you need to say here.', button: 'Keep chatting' },
    { id: 'work', type: 'text', topic: 'Work & study',
      text: 'How is work or school going? What feels most challenging right now?',
      reply: 'That’s a little more of your world I get to know. I’m cheering for you, one small step at a time.' },
    { type: 'chat', text: 'A tiny break with a little toast sounds pretty nice to me.', button: 'One more moment' },
    { id: 'health', type: 'text', topic: 'How you’re feeling',
      text: 'How are you feeling physically today? Is there any rest or care you wish you had time for?',
      reply: 'Thanks for checking in with me. I hope you can make a little room for the care you need.' },
    { type: 'chat', text: 'If all you did today was get through it, I’m still glad you stopped by.', button: 'Keep me company' },
    { id: 'weekend', type: 'text', topic: 'Your weekend',
      text: 'What’s your weekend plan—or what would you love to do?',
      reply: 'I hope your weekend has something that feels good to you, even if it’s simply doing less.' },
    { type: 'chat', text: 'Thanks for spending a little time with me. Come back whenever you feel like it.', button: 'Back to Q.alina' }
  ]
};
