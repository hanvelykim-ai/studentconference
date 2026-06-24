import { v4 as uuidv4 } from 'uuid'
import { getTodos, setTodos } from './_data.js'

export default async function handler(req, res) {
  const { id, identity } = req.query

  if (req.method === 'GET' && !id) {
    let todos = await getTodos()
    if (identity) todos = todos.filter(t => (t.assignedTo || []).includes(identity))
    return res.json(todos)
  }

  if (req.method === 'POST' && !id) {
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

  if (req.method === 'PUT' && id) {
    const todos = await getTodos()
    const idx = todos.findIndex(t => t.id === id)
    if (idx === -1) return res.status(404).json({ error: '없는 할 일입니다.' })

    if (req.body?.toggleComplete) {
      const ident = req.body.toggleComplete
      const done = todos[idx].completedBy || []
      const i = done.indexOf(ident)
      if (i >= 0) done.splice(i, 1)
      else done.push(ident)
      todos[idx].completedBy = done
      await setTodos(todos)
      return res.json(todos[idx])
    }

    todos[idx] = { ...todos[idx], ...req.body }
    await setTodos(todos)
    return res.json(todos[idx])
  }

  if (req.method === 'DELETE' && id) {
    const todos = await getTodos()
    await setTodos(todos.filter(t => t.id !== id))
    return res.json({ success: true })
  }

  res.status(405).end()
}
