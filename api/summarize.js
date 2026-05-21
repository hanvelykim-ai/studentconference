import { v4 as uuidv4 } from 'uuid'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getTopics, getSubs, getSums, setSums, setTopics, getSettings } from './_data.js'

function buildPrompt(topicTitle, topicDescription, submissions) {
  const subsText = submissions
    .sort((a, b) => a.grade - b.grade || a.class - b.class)
    .map(s => `[${s.grade}학년 ${s.class}반]\n${s.content}`)
    .join('\n\n---\n\n')

  return `다음은 학생자치회 회의 안건 "${topicTitle}"에 대한 각 반 회의 결과입니다.
${topicDescription ? `안건 설명: ${topicDescription}` : ''}

총 ${submissions.length}개 반의 의견:
${subsText}

위 의견들을 아래 규칙에 따라 아주 간단히 정리해주세요.

[정리 규칙]
1. 마크다운 기호(**,#,* 등)는 사용하지 마세요.
2. 중복되거나 비슷한 의견은 반드시 하나로 합치세요.
3. 카테고리는 최대 3개까지만 만드세요.
4. 각 카테고리에는 핵심 의견만 최대 3개까지만 적으세요.
5. 한 의견은 20자 이내의 짧은 문장으로 쓰세요.
6. 세부 설명, 배경 설명, 부연 설명은 쓰지 마세요.

[출력 형식]
◆ [카테고리 이름]
• 의견
• 의견

◆ [카테고리 이름]
• 의견
• 의견`;
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
    maxOutputTokens: 600,
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
        max_tokens: 600,
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
