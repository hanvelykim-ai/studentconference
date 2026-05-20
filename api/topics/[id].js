import { getTopics, setTopics, getSubs, setSubs, getSums, setSums } from '../_data.js'

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'PUT') {
    const topics = await getTopics()
    const idx = topics.findIndex(t => t.id === id)
    if (idx === -1) return res.status(404).json({ error: '없는 안건입니다.' })
    topics[idx] = { ...topics[idx], ...req.body }
    await setTopics(topics)
    return res.json(topics[idx])
  }

  if (req.method === 'DELETE') {
    const [topics, subs, sums] = await Promise.all([getTopics(), getSubs(), getSums()])
    await Promise.all([
      setTopics(topics.filter(t => t.id !== id)),
      setSubs(subs.filter(s => s.topicId !== id)),
      setSums(sums.filter(s => s.topicId !== id))
    ])
    return res.json({ success: true })
  }

  res.status(405).end()
}
