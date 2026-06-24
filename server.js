import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

const DATA_FILE = path.join(__dirname, 'data.json')

let data = {
  topics: [],
  submissions: [],
  summaries: [],
  meetings: [],
  elections: [],
  students: [],
  todos: [],
  settings: { teacherPin: '1234', aiProvider: 'claude', claudeApiKey: '', geminiApiKey: '' }
}

if (fs.existsSync(DATA_FILE)) {
  try {
    data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    data.meetings  = data.meetings  || []
    data.elections = data.elections || []
    data.students  = data.students  || []
    data.todos     = data.todos     || []
    const s = data.settings || {}
    // 이전 버전 apiKey → claudeApiKey 마이그레이션
    if (!s.claudeApiKey && s.apiKey) s.claudeApiKey = s.apiKey
    data.settings = {
      teacherPin:    s.teacherPin    || '1234',
      aiProvider:    s.aiProvider    || 'claude',
      claudeApiKey:  s.claudeApiKey  || '',
      geminiApiKey:  s.geminiApiKey  || ''
    }
  } catch (e) {
    console.error('데이터 로드 실패:', e)
  }
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// ── Topics ──────────────────────────────────────────────
app.get('/api/topics', (_req, res) => {
  res.json(data.topics)
})

app.post('/api/topics', (req, res) => {
  const { title, description, category } = req.body
  if (!title?.trim()) return res.status(400).json({ error: '제목이 필요합니다.' })
  const validCategories = ['협의사항', '건의사항', '이달의안건']
  if (!validCategories.includes(category)) return res.status(400).json({ error: '카테고리를 선택해주세요.' })
  const topic = {
    id: uuidv4(),
    title: title.trim(),
    description: description?.trim() || '',
    category,
    status: 'active',
    createdAt: new Date().toISOString()
  }
  data.topics.unshift(topic)
  saveData()
  res.json(topic)
})

app.put('/api/topics/:id', (req, res) => {
  const idx = data.topics.findIndex(t => t.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: '없는 안건입니다.' })
  data.topics[idx] = { ...data.topics[idx], ...req.body }
  saveData()
  res.json(data.topics[idx])
})

app.delete('/api/topics/:id', (req, res) => {
  data.topics      = data.topics.filter(t => t.id !== req.params.id)
  data.submissions = data.submissions.filter(s => s.topicId !== req.params.id)
  data.summaries   = data.summaries.filter(s => s.topicId !== req.params.id)
  saveData()
  res.json({ success: true })
})

// ── Submissions ──────────────────────────────────────────
app.get('/api/submissions', (req, res) => {
  const { topicId, grade, class: cls } = req.query
  let subs = [...data.submissions]
  if (topicId) subs = subs.filter(s => s.topicId === topicId)
  if (grade)   subs = subs.filter(s => s.grade === Number(grade))
  if (cls)     subs = subs.filter(s => s.class === Number(cls))
  res.json(subs)
})

app.post('/api/submissions', (req, res) => {
  const { topicId, grade, class: cls, content } = req.body
  if (!content?.trim()) return res.status(400).json({ error: '내용이 필요합니다.' })

  const existingIdx = data.submissions.findIndex(
    s => s.topicId === topicId && s.grade === grade && s.class === cls
  )

  if (existingIdx >= 0) {
    data.submissions[existingIdx].content   = content.trim()
    data.submissions[existingIdx].updatedAt = new Date().toISOString()
    saveData()
    return res.json(data.submissions[existingIdx])
  }

  const submission = {
    id: uuidv4(),
    topicId,
    grade: Number(grade),
    class: Number(cls),
    content: content.trim(),
    submittedAt: new Date().toISOString()
  }
  data.submissions.push(submission)
  saveData()
  res.json(submission)
})

// ── Summaries ────────────────────────────────────────────
app.get('/api/summaries/:topicId', (req, res) => {
  const summary = data.summaries.find(s => s.topicId === req.params.topicId)
  if (!summary) return res.status(404).json({ error: '요약 없음' })
  res.json(summary)
})

function buildPrompt(topicTitle, topicDescription, submissions) {
  const subsText = submissions
    .sort((a, b) => a.grade - b.grade || a.class - b.class)
    .map(s => `[${s.grade}학년 ${s.class}반]\n${s.content}`)
    .join('\n\n---\n\n')

  return `다음은 학생자치회 회의 안건 "${topicTitle}"에 대한 각 반 회의 결과입니다.${topicDescription ? `\n안건 설명: ${topicDescription}` : ''}

총 ${submissions.length}개 반의 의견:

${subsText}

위 의견들을 아래 규칙에 따라 정리해주세요. 마크다운 기호(**,#,* 등)는 사용하지 마세요.

[정리 규칙]
1. 내용이 같거나 거의 유사한 의견은 하나로 합쳐주세요.
2. 비슷한 성격의 의견들을 묶어 카테고리 이름을 붙여주세요. 카테고리는 내용에 따라 자유롭게 정하되, 3~6개가 적당합니다.
3. 각 카테고리 안에서 중복을 제거하고 의견을 • 목록으로 나열해주세요.
4. 출력 형식은 아래와 같이 해주세요:

◆ [카테고리 이름]
• 의견
• 의견

◆ [카테고리 이름]
• 의견

카테고리가 1개뿐인 경우도 위 형식을 그대로 사용하세요.`
}

app.post('/api/summarize', async (req, res) => {
  const { topicId } = req.body
  const { aiProvider, claudeApiKey, geminiApiKey } = data.settings

  const topic = data.topics.find(t => t.id === topicId)
  if (!topic) return res.status(404).json({ error: '안건을 찾을 수 없습니다.' })

  const submissions = data.submissions.filter(s => s.topicId === topicId)
  if (submissions.length === 0) return res.status(400).json({ error: '제출된 의견이 없습니다.' })

  const prompt = buildPrompt(topic.title, topic.description, submissions)
  let summaryText = ''

  try {
    if (aiProvider === 'gemini') {
      if (!geminiApiKey) return res.status(400).json({ error: '설정에서 Gemini API 키를 먼저 입력해주세요.' })
      const genAI = new GoogleGenerativeAI(geminiApiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' })
      const result = await model.generateContent(prompt)
      summaryText = result.response.text()
    } else {
      if (!claudeApiKey) return res.status(400).json({ error: '설정에서 Claude API 키를 먼저 입력해주세요.' })
      const client = new Anthropic({ apiKey: claudeApiKey })
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }]
      })
      summaryText = message.content[0].text
    }
  } catch (err) {
    console.error('AI 오류:', err)
    const isAuthError = err.status === 401 || err.status === 403 ||
      (err.message || '').toLowerCase().includes('api key')
    const msg = isAuthError
      ? 'API 키가 올바르지 않습니다. 설정에서 확인해주세요.'
      : `AI 요약 실패: ${err.message}`
    return res.status(500).json({ error: msg })
  }

  const existingIdx = data.summaries.findIndex(s => s.topicId === topicId)
  const summary = {
    id: existingIdx >= 0 ? data.summaries[existingIdx].id : uuidv4(),
    topicId,
    summary: summaryText,
    aiProvider,
    submissionCount: submissions.length,
    createdAt: new Date().toISOString()
  }

  if (existingIdx >= 0) {
    data.summaries[existingIdx] = summary
  } else {
    data.summaries.push(summary)
  }

  const topicIdx = data.topics.findIndex(t => t.id === topicId)
  if (topicIdx >= 0) data.topics[topicIdx].status = 'completed'

  saveData()
  res.json(summary)
})

// ── Settings ─────────────────────────────────────────────
app.get('/api/settings', (_req, res) => {
  const { teacherPin, aiProvider, claudeApiKey, geminiApiKey } = data.settings
  res.json({
    teacherPin,
    aiProvider,
    hasClaudeKey: !!claudeApiKey,
    hasGeminiKey: !!geminiApiKey
  })
})

app.put('/api/settings', (req, res) => {
  const { teacherPin, aiProvider, claudeApiKey, geminiApiKey } = req.body
  const s = data.settings
  if (teacherPin  !== undefined) s.teacherPin  = teacherPin
  if (aiProvider  !== undefined) s.aiProvider  = aiProvider
  if (claudeApiKey !== undefined) s.claudeApiKey = claudeApiKey
  if (geminiApiKey !== undefined) s.geminiApiKey = geminiApiKey
  saveData()
  res.json({ success: true, hasClaudeKey: !!s.claudeApiKey, hasGeminiKey: !!s.geminiApiKey })
})

app.post('/api/verify-pin', (req, res) => {
  res.json({ valid: req.body.pin === data.settings.teacherPin })
})

// ── Meetings (전교 회의 일정) ──────────────────────────────
app.get('/api/meetings', (_req, res) => {
  res.json(data.meetings)
})

app.post('/api/meetings', (req, res) => {
  const { title, date, time, location } = req.body
  if (!title?.trim()) return res.status(400).json({ error: '제목이 필요합니다.' })
  if (!date) return res.status(400).json({ error: '날짜가 필요합니다.' })
  const meeting = {
    id: uuidv4(),
    title: title.trim(),
    date,
    time: time || '',
    location: location?.trim() || '',
    attendance: [],
    createdAt: new Date().toISOString()
  }
  data.meetings.unshift(meeting)
  saveData()
  res.json(meeting)
})

app.put('/api/meetings/:id', (req, res) => {
  const idx = data.meetings.findIndex(m => m.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: '없는 일정입니다.' })

  if (req.body?.toggleAttendance) {
    const { grade, class: cls } = req.body.toggleAttendance
    const att = data.meetings[idx].attendance || []
    const existing = att.findIndex(a => a.grade === Number(grade) && a.class === Number(cls))
    if (existing >= 0) att.splice(existing, 1)
    else att.push({ grade: Number(grade), class: Number(cls), checkedAt: new Date().toISOString() })
    data.meetings[idx].attendance = att
    saveData()
    return res.json(data.meetings[idx])
  }

  data.meetings[idx] = { ...data.meetings[idx], ...req.body }
  saveData()
  res.json(data.meetings[idx])
})

app.delete('/api/meetings/:id', (req, res) => {
  data.meetings = data.meetings.filter(m => m.id !== req.params.id)
  saveData()
  res.json({ success: true })
})

// ── Elections (선거 일정) ──────────────────────────────────
app.get('/api/elections', (_req, res) => {
  res.json(data.elections)
})

app.post('/api/elections', (req, res) => {
  const { title, date, description } = req.body
  if (!title?.trim()) return res.status(400).json({ error: '제목이 필요합니다.' })
  if (!date) return res.status(400).json({ error: '날짜가 필요합니다.' })
  const election = {
    id: uuidv4(),
    title: title.trim(),
    date,
    description: description?.trim() || '',
    createdAt: new Date().toISOString()
  }
  data.elections.unshift(election)
  saveData()
  res.json(election)
})

app.put('/api/elections/:id', (req, res) => {
  const idx = data.elections.findIndex(e => e.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: '없는 일정입니다.' })
  data.elections[idx] = { ...data.elections[idx], ...req.body }
  saveData()
  res.json(data.elections[idx])
})

app.delete('/api/elections/:id', (req, res) => {
  data.elections = data.elections.filter(e => e.id !== req.params.id)
  saveData()
  res.json({ success: true })
})

// ── Students roster (관리자 전용, 직위-이름 매칭) ────────────
app.get('/api/students', (_req, res) => {
  res.json(data.students)
})

app.post('/api/students', (req, res) => {
  const { slotKey, name } = req.body
  if (!slotKey) return res.status(400).json({ error: 'slotKey가 필요합니다.' })
  const idx = data.students.findIndex(s => s.slotKey === slotKey)

  if (!name?.trim()) {
    if (idx >= 0) { data.students.splice(idx, 1); saveData() }
    return res.json({ success: true })
  }

  if (idx >= 0) {
    data.students[idx].name = name.trim()
    data.students[idx].updatedAt = new Date().toISOString()
  } else {
    data.students.push({ id: uuidv4(), slotKey, name: name.trim(), updatedAt: new Date().toISOString() })
  }
  saveData()
  res.json({ success: true })
})

// ── Todos (할 일) ──────────────────────────────────────────
app.get('/api/todos', (req, res) => {
  const { identity } = req.query
  let todos = data.todos
  if (identity) todos = todos.filter(t => (t.assignedTo || []).includes(identity))
  res.json(todos)
})

app.post('/api/todos', (req, res) => {
  const { title, description, dueDate, assignedTo } = req.body
  if (!title?.trim()) return res.status(400).json({ error: '제목이 필요합니다.' })
  if (!Array.isArray(assignedTo) || assignedTo.length === 0) {
    return res.status(400).json({ error: '할 일을 받을 학생을 선택해주세요.' })
  }
  const todo = {
    id: uuidv4(),
    title: title.trim(),
    description: description?.trim() || '',
    dueDate: dueDate || '',
    assignedTo,
    completedBy: [],
    createdAt: new Date().toISOString()
  }
  data.todos.unshift(todo)
  saveData()
  res.json(todo)
})

app.put('/api/todos/:id', (req, res) => {
  const idx = data.todos.findIndex(t => t.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: '없는 할 일입니다.' })

  if (req.body?.toggleComplete) {
    const identity = req.body.toggleComplete
    const done = data.todos[idx].completedBy || []
    const i = done.indexOf(identity)
    if (i >= 0) done.splice(i, 1)
    else done.push(identity)
    data.todos[idx].completedBy = done
    saveData()
    return res.json(data.todos[idx])
  }

  data.todos[idx] = { ...data.todos[idx], ...req.body }
  saveData()
  res.json(data.todos[idx])
})

app.delete('/api/todos/:id', (req, res) => {
  data.todos = data.todos.filter(t => t.id !== req.params.id)
  saveData()
  res.json({ success: true })
})

// ── Static (production) ───────────────────────────────────
app.use(express.static(path.join(__dirname, 'dist')))
app.get('*', (_req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html')
  if (fs.existsSync(indexPath)) res.sendFile(indexPath)
  else res.status(404).send('빌드 파일이 없습니다. npm run build를 먼저 실행하세요.')
})

app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`)
  console.log(`   초기 교사 PIN: 1234`)
})
