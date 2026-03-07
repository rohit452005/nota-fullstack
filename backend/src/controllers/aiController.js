const { validationResult } = require('express-validator');

const callClaude = async (systemPrompt, userPrompt) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Anthropic API error');
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
};

// POST /api/ai/beautify
exports.beautify = async (req, res) => {
  const { title, content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Content is required.' });

  try {
    const result = await callClaude(
      'You are a brilliant editor. Beautify and restructure the note content to be clearer, more elegant, and better organized. Preserve all information. Use markdown-style formatting with headers (##), bullet points, bold (**text**), and clear sections where appropriate. Return ONLY the beautified content, nothing else.',
      `Note title: "${title}"\n\nNote content:\n${content}`
    );
    res.json({ result });
  } catch (err) {
    console.error('Beautify error:', err);
    res.status(500).json({ error: 'AI beautification failed.' });
  }
};

// POST /api/ai/categorize
exports.categorize = async (req, res) => {
  const { title, content } = req.body;
  if (!content?.trim() && !title?.trim()) return res.status(400).json({ error: 'Title or content required.' });

  try {
    const raw = await callClaude(
      'Analyze this note and respond ONLY with a JSON object like:\n{"category": "ideas|specs|tasks|research|personal", "tags": ["tag1", "tag2", "tag3"], "suggestedTitle": "Better title or keep original", "reason": "One sentence why"}\nNo markdown, no preamble. Pure JSON only.',
      `Note title: "${title}"\n\nNote content:\n${content}`
    );

    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      res.json({ result: parsed });
    } catch {
      res.json({ result: { reason: raw } });
    }
  } catch (err) {
    console.error('Categorize error:', err);
    res.status(500).json({ error: 'AI categorization failed.' });
  }
};

// POST /api/ai/ideas
exports.sparkIdeas = async (req, res) => {
  const { title, content } = req.body;
  if (!content?.trim() && !title?.trim()) return res.status(400).json({ error: 'Title or content required.' });

  try {
    const result = await callClaude(
      'You are a creative thinking partner. Based on this note, generate 5 compelling, specific, actionable ideas or directions to explore. Be creative and surprising. Format as a numbered list with each idea on its own line. Start directly with "1." — no preamble.',
      `Note title: "${title}"\n\nNote content:\n${content}`
    );
    res.json({ result });
  } catch (err) {
    console.error('Spark ideas error:', err);
    res.status(500).json({ error: 'AI idea generation failed.' });
  }
};
