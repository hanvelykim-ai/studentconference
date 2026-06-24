import { getMeetings, setMeetings } from '../_data.js'

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'PUT') {
    const meetings = await getMeetings()
    const idx = meetings.findIndex(m => m.id === id)
    if (idx === -1) return res.status(404).json({ error: '없는 일정입니다.' })

    // 출석(반대표) 체크/취소: { grade, class } 토글
    if (req.body?.toggleAttendance) {
      const { grade, class: cls } = req.body.toggleAttendance
      const att = meetings[idx].attendance || []
      const existing = att.findIndex(a => a.grade === Number(grade) && a.class === Number(cls))
      if (existing >= 0) {
        att.splice(existing, 1)
      } else {
        att.push({ grade: Number(grade), class: Number(cls), checkedAt: new Date().toISOString() })
      }
      meetings[idx].attendance = att
      await setMeetings(meetings)
      return res.json(meetings[idx])
    }

    meetings[idx] = { ...meetings[idx], ...req.body }
    await setMeetings(meetings)
    return res.json(meetings[idx])
  }

  if (req.method === 'DELETE') {
    const meetings = await getMeetings()
    await setMeetings(meetings.filter(m => m.id !== id))
    return res.json({ success: true })
  }

  res.status(405).end()
}
