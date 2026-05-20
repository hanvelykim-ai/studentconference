import { v4 as uuidv4 } from 'uuid'
import { getSubs, setSubs } from '../_data.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { topicId, grade, class: cls } = req.query
    let subs = await getSubs()
    if (topicId) subs = subs.filter(s => s.topicId === topicId)
    if (grade)   subs = subs.filter(s => s.grade === Number(grade))
    if (cls)     subs = subs.filter(s => s.class === Number(cls))
    return res.json(subs)
  }

  if (req.method === 'POST') {
    const { topicId, grade, class: cls, content } = req.body
    if (!content?.trim()) return res.status(400).json({ error: '내용이 필요합니다.' })
    const subs = await getSubs()
    const existingIdx = subs.findIndex(
      s => s.topicId === topicId && s.grade === grade && s.class === cls
    )
    if (existingIdx >= 0) {
      subs[existingIdx].content   = content.trim()
      subs[existingIdx].updatedAt = new Date().toISOString()
      await setSubs(subs)
      return res.json(subs[existingIdx])
    }
    const submission = {
      id: uuidv4(),
      topicId,
      grade: Number(grade),
      class: Number(cls),
      content: content.trim(),
      submittedAt: new Date().toISOString()
    }
    subs.push(submission)
    await setSubs(subs)
    return res.json(submission)
  }

  res.status(405).end()
}
