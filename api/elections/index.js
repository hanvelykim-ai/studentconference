import { v4 as uuidv4 } from 'uuid'
import { getElections, setElections } from '../_data.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.json(await getElections())
  }

  if (req.method === 'POST') {
    const { title, date, description } = req.body
    if (!title?.trim()) return res.status(400).json({ error: '제목이 필요합니다.' })
    if (!date) return res.status(400).json({ error: '날짜가 필요합니다.' })

    const elections = await getElections()
    const election = {
      id: uuidv4(),
      title: title.trim(),
      date,
      description: description?.trim() || '',
      createdAt: new Date().toISOString()
    }
    elections.unshift(election)
    await setElections(elections)
    return res.json(election)
  }

  res.status(405).end()
}
