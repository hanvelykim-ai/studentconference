import { v4 as uuidv4 } from 'uuid'
import { getMeetings, setMeetings } from './_data.js'

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'GET' && !id) {
    return res.json(await getMeetings())
  }

  if (req.method === 'POST' && !id) {
    const { title, date, time, location } = req.body
    if (!title?.trim()) return res.status(400).json({ error: '제목이 필요합니다.' })
    if (!date) return res.status(400).json({ error: '날짜가 필요합니다.' })

    const meetings = await getMeetings()
    const meeting = {
      id: uuidv4(),
      title: title.trim(),
      date,
      time: time || '',
      location: location?.trim() || '',
      attendance: [],
      createdAt: new Date().toISOString()
    }
    meetings.unshift(meeting)
    await setMeetings(meetings)
    return res.json(meeting)
  }

  if (req.method === 'PUT' && id) {
    const meetings = await getMeetings()
    const idx = meetings.findIndex(m => m.id === id)
    if (idx === -1) return res.status(404).json({ error: '없는 일정입니다.' })

    if (req.body?.toggleAttendance) {
      const { grade, class: cls } = req.body.toggleAttendance
      const att = meetings[idx].attendance || []
      const existing = att.findIndex(a => a.grade === Number(grade) && a.class === Number(cls))
      if (existing >= 0) att.splice(existing, 1)
      else att.push({ grade: Number(grade), class: Number(cls), checkedAt: new Date().toISOString() })
      meetings[idx].attendance = att
      await setMeetings(meetings)
      return res.json(meetings[idx])
    }

    meetings[idx] = { ...meetings[idx], ...req.body }
    await setMeetings(meetings)
    return res.json(meetings[idx])
  }

  if (req.method === 'DELETE' && id) {
    const meetings = await getMeetings()
    await setMeetings(meetings.filter(m => m.id !== id))
    return res.json({ success: true })
  }

  res.status(405).end()
}
