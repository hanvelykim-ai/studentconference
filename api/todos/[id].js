import { getTodos, setTodos } from '../_data.js'

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'PUT') {
    const todos = await getTodos()
    const idx = todos.findIndex(t => t.id === id)
    if (idx === -1) return res.status(404).json({ error: '없는 할 일입니다.' })

    // 학생이 본인 완료 체크 토글
    if (req.body?.toggleComplete) {
      const identity = req.body.toggleComplete
      const done = todos[idx].completedBy || []
      const i = done.indexOf(identity)
      if (i >= 0) done.splice(i, 1)
      else done.push(identity)
      todos[idx].completedBy = done
      await setTodos(todos)
      return res.json(todos[idx])
    }

    todos[idx] = { ...todos[idx], ...req.body }
    await setTodos(todos)
    return res.json(todos[idx])
  }

  if (req.method === 'DELETE') {
    const todos = await getTodos()
    await setTodos(todos.filter(t => t.id !== id))
    return res.json({ success: true })
  }

  res.status(405).end()
}
