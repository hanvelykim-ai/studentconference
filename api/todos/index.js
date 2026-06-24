import { v4 as uuidv4 } from 'uuid'
import { getTodos, setTodos } from '../_data.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { identity } = req.query
    let todos = await getTodos()
    if (identity) todos = todos.filter(t => (t.assignedTo || []).includes(identity))
    return res.json(todos)
  }

  if (req.method === 'POST') {
    const { title, description, dueDate, assignedTo } = req.body
    if (!title?.trim()) return res.status(400).json({ error: '제목이 필요합니다.' })
    if (!Array.isArray(assignedTo) || assignedTo.length === 0) {
      return res.status(400).json({ error: '할 일을 받을 학생을 선택해주세요.' })
    }

    const todos = await getTodos()
    const todo = {
      id: uuidv4(),
      title: title.trim(),
      description: description?.trim() || '',
      dueDate: dueDate || '',
      assignedTo,
      completedBy: [],
      createdAt: new Date().toISOString()
    }
    todos.unshift(todo)
    await setTodos(todos)
    return res.json(todo)
  }

  res.status(405).end()
}
