import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const userId = 'nikhar';

  if (req.method === 'GET') {
    try {
      const logs = await kv.get(`logs:${userId}`) || [];
      const principles = await kv.get(`principles:${userId}`) || [];
      return res.status(200).json({ logs, principles });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'POST') {
    const { action, data } = req.body || {};
    try {
      if (action === 'add_log') {
        const logs = await kv.get(`logs:${userId}`) || [];
        logs.unshift(data);
        await kv.set(`logs:${userId}`, logs);
        await syncToSheets('log', data);
        return res.status(200).json({ ok: true });
      }
      if (action === 'save_principle') {
        const { logId, principle, principleEntry } = data;
        const logs = await kv.get(`logs:${userId}`) || [];
        const log = logs.find(l => l.id === logId);
        if (log) log.principle = principle;
        await kv.set(`logs:${userId}`, logs);
        const principles = await kv.get(`principles:${userId}`) || [];
        principles.unshift(principleEntry);
        await kv.set(`principles:${userId}`, principles);
        await syncToSheets('principle', principleEntry);
        return res.status(200).json({ ok: true });
      }
      return res.status(400).json({ error: 'Unknown action' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function syncToSheets(type, data) {
  const url = process.env.GOOGLE_SHEETS_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...data })
    });
  } catch (e) {
    console.error('Sheets sync failed:', e.message);
  }
}
