import { getSums } from '../_data.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const { topicId } = req.query
  const sums = await getSums()
  const summary = sums.find(s => s.topicId === topicId)
  if (!summary) return res.status(404).json({ error: '요약 없음' })
  res.json(summary)
}
