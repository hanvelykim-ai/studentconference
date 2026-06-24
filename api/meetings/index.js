import { v4 as uuidv4 } from 'uuid'
import { getMeetings, setMeetings } from '../_data.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.json(await getMeetings())
  }

  if (req.method === 'POST') {
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
      attendance: [],   // [{ grade, class, checkedAt }]
      createdAt: new Date().toISOString()
    }
    meetings.unshift(meeting)
    await setMeetings(meetings)
    return res.json(meeting)
  }

  res.status(405).end()
}
