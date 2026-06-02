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
        system: `You are a direct, no-fluff reflection guide. Help extract a real principle from a painful moment.
Return ONLY valid JSON, no markdown:
{"questions":["one sharp question","one deeper question"],"principle":"One sentence. Starts with action verb. Specific enough to use next time."}`,
        messages: [{ role: 'user', content: `Pain type: ${type||'Other'}\nIntensity: ${intensity||'not set'}/5\nWhat happened: ${text}` }]
      })
    });
    const data = await response.json();
    const raw = data.content?.map(c => c.text || '').join('') || '';
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: 'AI unavailable', details: e.message });
  }
}
