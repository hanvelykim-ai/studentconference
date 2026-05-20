import { getSettings, setSettings } from './_data.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const s = await getSettings()
    return res.json({
      teacherPin:   s.teacherPin,
      aiProvider:   s.aiProvider,
      hasClaudeKey: !!s.claudeApiKey,
      hasGeminiKey: !!s.geminiApiKey
    })
  }

  if (req.method === 'PUT') {
    const s = await getSettings()
    const { teacherPin, aiProvider, claudeApiKey, geminiApiKey } = req.body
    if (teacherPin   !== undefined) s.teacherPin   = teacherPin
    if (aiProvider   !== undefined) s.aiProvider   = aiProvider
    if (claudeApiKey !== undefined) s.claudeApiKey = claudeApiKey
    if (geminiApiKey !== undefined) s.geminiApiKey = geminiApiKey
    await setSettings(s)
    return res.json({ success: true, hasClaudeKey: !!s.claudeApiKey, hasGeminiKey: !!s.geminiApiKey })
  }

  res.status(405).end()
}
