export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, intensity, text, voiceTranscript } = req.body || {};
  if (!text) return res.status(400).json({ error: 'Missing text' });

  const voiceContext = voiceTranscript && voiceTranscript !== '[voice note recorded]'
    ? `\nUser's voice reflection: "${voiceTranscript}"`
    : '';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: `You help people extract growth principles from painful moments. 
Return ONLY valid JSON, no markdown:
{"principle":"One sentence. Starts with action verb. Specific and actionable for next time this happens."}
Tone: direct, honest. No therapy-speak.`,
        messages: [{
          role: 'user',
          content: `Pain type: ${type||'Other'}\nIntensity: ${intensity||'—'}/5\nWhat happened: ${text}${voiceContext}`
        }]
      })
    });

    const data = await response.json();
    const raw = data.content?.map(c => c.text || '').join('') || '';
    const parsed = JSON.parse(raw.replace(/```json|```/g,'').trim());
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: 'AI unavailable', details: e.message });
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
