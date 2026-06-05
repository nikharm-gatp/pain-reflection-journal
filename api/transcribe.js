export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Parse multipart form
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    const boundary = req.headers['content-type']?.split('boundary=')[1];
    if (!boundary) return res.status(400).json({ error: 'No boundary' });

    // Extract audio blob and metadata
    const parts = buffer.toString('binary').split('--' + boundary);
    let audioBuffer = null, painText = '', painType = '';

    for (const part of parts) {
      if (part.includes('name="audio"')) {
        const dataStart = part.indexOf('\r\n\r\n') + 4;
        const dataEnd = part.lastIndexOf('\r\n');
        audioBuffer = Buffer.from(part.slice(dataStart, dataEnd), 'binary');
      }
      if (part.includes('name="painText"')) {
        const dataStart = part.indexOf('\r\n\r\n') + 4;
        painText = part.slice(dataStart).replace(/\r\n$/, '').trim();
      }
      if (part.includes('name="painType"')) {
        const dataStart = part.indexOf('\r\n\r\n') + 4;
        painType = part.slice(dataStart).replace(/\r\n$/, '').trim();
      }
    }

    if (!audioBuffer || audioBuffer.length < 100) {
      return res.status(200).json({ transcript: '' });
    }

    // Use Claude to interpret the audio context + generate principle directly
    // Since Whisper isn't available, we use the pain context to generate
    // In production you'd send to Whisper API here
    // For now return empty and let /api/reflect handle it
    return res.status(200).json({ transcript: '[voice note recorded]' });

  } catch (e) {
    console.error(e);
    return res.status(200).json({ transcript: '' });
  }
}
