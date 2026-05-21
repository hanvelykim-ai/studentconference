import { v4 as uuidv4 } from 'uuid'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getTopics, getSubs, getSums, setSums, setTopics, getSettings } from './_data.js'

function buildPrompt(topicTitle, topicDescription, submissions) {
  const subsText = submissions
    .sort((a, b) => a.grade - b.grade || a.class - b.class)
    .map(s => `[${s.grade}학년 ${s.class}반]\n${s.content}`)
    .join('\n\n---\n\n')

return `
너는 초등학교 학생자치회 회의록을 정리하는 교사 보조자입니다.

아래 학생 의견을 한국어로만 정리하세요.
영어, 번역어, 슬래시(/), 화살표(->), 마크다운 기호는 절대 사용하지 마세요.
반 이름은 쓰지 마세요.
새로운 내용을 만들지 마세요.

출력 형식은 반드시 아래 형식만 사용하세요.

[시설 관련 의견]
- 의견 1
- 의견 2

[규칙 관련 의견]
- 의견 1
- 의견 2

[기타 의견]
- 의견 1
- 의견 2

각 항목은 최대 2개까지만 작성하세요.
해당 의견이 없으면 그 카테고리는 쓰지 마세요.

학생 의견:
${subsText}
`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { topicId } = req.body
  const [topics, allSubs, sums, settings] = await Promise.all([
    getTopics(), getSubs(), getSums(), getSettings()
  ])

  const topic = topics.find(t => t.id === topicId)
  if (!topic) return res.status(404).json({ error: '안건을 찾을 수 없습니다.' })

  const submissions = allSubs.filter(s => s.topicId === topicId)
  if (submissions.length === 0) return res.status(400).json({ error: '제출된 의견이 없습니다.' })

  const { aiProvider, claudeApiKey, geminiApiKey } = settings
  const prompt = buildPrompt(topic.title, topic.description, submissions)
  let summaryText = ''

  try {
    if (aiProvider === 'gemini') {
      if (!geminiApiKey) return res.status(400).json({ error: '설정에서 Gemini API 키를 먼저 입력해주세요.' })
      const genAI = new GoogleGenerativeAI(geminiApiKey)
      const model = genAI.getGenerativeModel({
  model: 'gemini-3.5-flash',
  generationConfig: {
    maxOutputTokens: 1024,
    temperature: 0.3,
  },
})
const result = await model.generateContent(prompt)
      summaryText = result.response.text()
    } else {
      if (!claudeApiKey) return res.status(400).json({ error: '설정에서 Claude API 키를 먼저 입력해주세요.' })
      const client = new Anthropic({ apiKey: claudeApiKey })
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
      summaryText = message.content[0].text
    }
  } catch (err) {
    console.error('AI 오류:', err)
    const isAuthError = err.status === 401 || err.status === 403 ||
      (err.message || '').toLowerCase().includes('api key')
    return res.status(500).json({
      error: isAuthError
        ? 'API 키가 올바르지 않습니다. 설정에서 확인해주세요.'
        : `AI 요약 실패: ${err.message}`
    })
  }

  const existingIdx = sums.findIndex(s => s.topicId === topicId)
  const summary = {
    id: existingIdx >= 0 ? sums[existingIdx].id : uuidv4(),
    topicId,
    summary: summaryText,
    aiProvider,
    submissionCount: submissions.length,
    createdAt: new Date().toISOString()
  }

  if (existingIdx >= 0) sums[existingIdx] = summary
  else sums.push(summary)

  const topicIdx = topics.findIndex(t => t.id === topicId)
  if (topicIdx >= 0) topics[topicIdx].status = 'completed'

  await Promise.all([setSums(sums), setTopics(topics)])
  res.json(summary)
}
