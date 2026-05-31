export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, intensity, text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'Missing text' });

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
        max_tokens: 600,
        system: `You are a quiet, direct reflection guide. The user logs painful or uncomfortable moments to grow from them.

Your job: help them extract a real, actionable principle from this moment.

Return ONLY valid JSON — no preamble, no markdown:
{
  "questions": ["one sharp question", "one deeper question"],
  "principle": "One sentence. Starts with an action verb. Specific enough to use next time this happens."
}

Tone: direct, honest, zero therapy-speak. Like a smart mentor asking the right question.`,
        messages: [{
          role: 'user',
          content: `Pain type: ${type || 'Other'}\nIntensity: ${intensity || 'not set'}/5\nWhat happened: ${text}`
        }]
      })
    });

    const data = await response.json();
    const raw = data.content?.map(c => c.text || '').join('') || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return res.status(200).json(parsed);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'AI unavailable', details: e.message });
  }
}
