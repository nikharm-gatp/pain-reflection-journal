export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, intensity, text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'Missing text' });

  // ── Local reflection engine (no API key needed) ──

  const t = (type || 'Other').toLowerCase();
  const lvl = parseInt(intensity) || 0;
  const words = text.toLowerCase();

  // Question banks by pain type
  const qMap = {
    frustration: [
      'What exactly did you expect to happen — and where did that expectation come from?',
      'If this happened again tomorrow, what one thing would you do differently in the first 60 seconds?',
      'What does this frustration reveal about a standard you hold — is that standard worth keeping?',
      'Who or what had control here that you assumed you had? What would it actually take to get that control?',
      'What would handling this well have looked like — and how close did you get?',
    ],
    emotional: [
      'What belief about yourself or the world got challenged in this moment?',
      'If a close friend described this situation to you, what would you tell them?',
      'What part of this feeling is about the event itself, and what part is older than today?',
      'What would you need in order to feel differently — and is that within your reach?',
      'What is this emotion trying to protect or change?',
    ],
    conflict: [
      'What did the other person need that you may not have fully acknowledged?',
      'What would you say differently if you could rewind to the first 30 seconds?',
      'Is this a one-off or the latest episode in a recurring pattern?',
      'What outcome were you actually optimising for in that moment — was it the right one?',
      'If they told their version, what would be the most uncomfortably true part of it?',
    ],
    decision: [
      'What information did you have at decision time, and what were you missing?',
      'What fear or desire was loudest when you made the call — should it have been?',
      'What would a person you deeply respect have decided here, and why?',
      'If this turns out wrong, what will have been the root cause?',
      'What would you need to put in place so this type of decision goes better next time?',
    ],
    failure: [
      'At what specific point did this stop going well — what was the earliest warning sign?',
      'What did you do right that deserves credit, even inside this failure?',
      'What assumption turned out to be wrong, and how did you build it?',
      'If you had to do this again with 20% more preparation, what would that 20% be?',
      'Is this evidence of a skill gap, a system gap, or a one-off — and does that change what you do next?',
    ],
    fear: [
      'What is the actual worst case here — and what would you do if it happened?',
      'Is this fear protecting you from something real, or from something you have outgrown?',
      'What has this fear caused you to avoid that might be worth doing anyway?',
      'What would change if the probability of the feared outcome was cut in half?',
      'Who would you be if you acted despite this fear — just this once?',
    ],
    regret: [
      'What were you trying to protect or gain when you made that choice?',
      'What did you know then that you did not let yourself fully hear?',
      'What would forgiving yourself for this actually look like in practice?',
      'What is one concrete thing in the next 24 hours that partially repairs or honours what went wrong?',
      'If you carry this regret for ten more years, what will it have cost you?',
    ],
  };

  const genericQ = [
    'What is the one thing you most wish had gone differently — and what part was within your control?',
    'What did this experience reveal about what you value most?',
    'What would you tell someone you care about if they went through exactly this?',
    'What small action in the next 24 hours would move you forward from this?',
    'What belief drove your behaviour here — and does that belief still serve you?',
  ];

  // Pick question bank
  let pool = genericQ;
  for (const key of Object.keys(qMap)) {
    if (t.includes(key) || words.includes(key)) { pool = qMap[key]; break; }
  }

  // Shuffle and pick 2
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const q1 = shuffled[0];
  const q2 = shuffled[1] || genericQ[Math.floor(Math.random() * genericQ.length)];

  // ── Principle generator ──

  const principleOpeners = {
    frustration: [
      'When frustration spikes, name what you actually control before taking any action.',
      'Set expectations explicitly upfront instead of assuming — it prevents most friction.',
      'Vague frustration compounds; specific frustration solves. Define the problem precisely first.',
    ],
    emotional: [
      'When the feeling is strong, wait one hour before deciding it defines the situation.',
      'Separate what happened from what it means — the story you attach matters as much as the event.',
      'Acknowledge the emotion first; trying to logic it away before feeling it never sticks.',
    ],
    conflict: [
      'State what you need and ask what they need before defending any position.',
      'Say the uncomfortably honest thing early — it always costs less than saying it late.',
      'Find the one thing you agree on before addressing the thing you do not.',
    ],
    decision: [
      'Write the decision and your reasoning down before you make it — it forces honesty.',
      'When uncertain, ask what you would advise a close friend; you already know more than you think.',
      'Define what good enough looks like before evaluating options, or you will never commit.',
    ],
    failure: [
      'Find the first warning sign you ignored — that is the real lesson, not the outcome.',
      'Separate what failed from who failed; a bad outcome does not equal a bad person.',
      'After every failure, ask one question: what would I do first, differently?',
    ],
    fear: [
      'Name the fear precisely in writing — unnamed fear grows, named fear shrinks.',
      'Act once in the direction of the fear; one small move breaks the spell more than a hundred plans.',
      'Distinguish fears that protect from fears that merely limit — keep only the ones that protect.',
    ],
    regret: [
      'Extract one forward-facing commitment from every regret so it earns meaning instead of just costing you.',
      'You made the best call available with who you were then — judge the system, not the person.',
      'Use regret as a compass, not a prison — it points at what you value, then let it go.',
    ],
  };

  const genericPrinciples = [
    'Act on what is within your control; release what is not — returning to this distinction ends most spirals.',
    'Write the lesson before the sting fades — the clear-eyed version taken early is the useful one.',
    'When something goes wrong, ask what system failed before asking who failed.',
    'Discomfort that teaches is worth more than comfort that does not — look for the instruction immediately.',
    'The next time this situation type arises, do the thing you wished you had done today.',
  ];

  let pPool = genericPrinciples;
  for (const key of Object.keys(principleOpeners)) {
    if (t.includes(key) || words.includes(key)) { pPool = principleOpeners[key]; break; }
  }

  // Higher intensity gets the sharpest (first) principle
  const idx = lvl >= 4 ? 0 : Math.floor(Math.random() * pPool.length);
  const principle = pPool[idx];

  return res.status(200).json({ questions: [q1, q2], principle });
}
