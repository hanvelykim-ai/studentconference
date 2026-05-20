import { v4 as uuidv4 } from 'uuid'
import { getTopics, setTopics } from '../_data.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.json(await getTopics())
  }
  if (req.method === 'POST') {
    const { title, description } = req.body
    if (!title?.trim()) return res.status(400).json({ error: '제목이 필요합니다.' })
    const topics = await getTopics()
    const topic = {
      id: uuidv4(),
      title: title.trim(),
      description: description?.trim() || '',
      status: 'active',
      createdAt: new Date().toISOString()
    }
    topics.unshift(topic)
    await setTopics(topics)
    return res.json(topic)
  }
  res.status(405).end()
}
