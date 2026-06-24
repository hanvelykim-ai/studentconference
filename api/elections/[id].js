import { getElections, setElections } from '../_data.js'

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'PUT') {
    const elections = await getElections()
    const idx = elections.findIndex(e => e.id === id)
    if (idx === -1) return res.status(404).json({ error: '없는 일정입니다.' })
    elections[idx] = { ...elections[idx], ...req.body }
    await setElections(elections)
    return res.json(elections[idx])
  }

  if (req.method === 'DELETE') {
    const elections = await getElections()
    await setElections(elections.filter(e => e.id !== id))
    return res.json({ success: true })
  }

  res.status(405).end()
}
