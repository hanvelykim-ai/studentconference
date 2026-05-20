import { getSettings } from './_data.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const settings = await getSettings()
  res.json({ valid: req.body.pin === settings.teacherPin })
}
