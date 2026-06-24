import { v4 as uuidv4 } from 'uuid'
import { getStudents, setStudents } from '../_data.js'

// slotKey 예: c-2-1-회장 (2학년1반 회장) / s-전교회장 / s-전교부회장-5
export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.json(await getStudents())
  }

  if (req.method === 'POST') {
    const { slotKey, name } = req.body
    if (!slotKey) return res.status(400).json({ error: 'slotKey가 필요합니다.' })

    const students = await getStudents()
    const idx = students.findIndex(s => s.slotKey === slotKey)

    if (!name?.trim()) {
      // 이름을 비우면 등록 해제
      if (idx >= 0) {
        students.splice(idx, 1)
        await setStudents(students)
      }
      return res.json({ success: true })
    }

    if (idx >= 0) {
      students[idx].name = name.trim()
      students[idx].updatedAt = new Date().toISOString()
    } else {
      students.push({ id: uuidv4(), slotKey, name: name.trim(), updatedAt: new Date().toISOString() })
    }
    await setStudents(students)
    return res.json({ success: true })
  }

  res.status(405).end()
}
