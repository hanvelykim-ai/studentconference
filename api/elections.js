import { v4 as uuidv4 } from 'uuid'
import { getElections, setElections } from './_data.js'

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'GET' && !id) {
    return res.json(await getElections())
  }

  if (req.method === 'POST' && !id) {
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

  if (req.method === 'PUT' && id) {
    const elections = await getElections()
    const idx = elections.findIndex(e => e.id === id)
    if (idx === -1) return res.status(404).json({ error: '없는 일정입니다.' })
    elections[idx] = { ...elections[idx], ...req.body }
    await setElections(elections)
    return res.json(elections[idx])
  }

  if (req.method === 'DELETE' && id) {
    const elections = await getElections()
    await setElections(elections.filter(e => e.id !== id))
    return res.json({ success: true })
  }

  res.status(405).end()
}
