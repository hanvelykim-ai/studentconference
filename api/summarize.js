import { v4 as uuidv4 } from 'uuid'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  getTopics,
  getSubs,
  getSums,
  setSums,
  setTopics,
  getSettings
} from './_data.js'

function buildPrompt(topicTitle, topicDescription, submissions) {
  const subsText = submissions
    .sort((a, b) => a.grade - b.grade || a.class - b.class)
    .map(
      s => `[${s.grade}학년 ${s.class}반]
${s.content}`
    )
    .join('\n\n---\n\n')

  return `
다음은 초등학교 학생자치회 회의 결과입니다.

주제: ${topicTitle}
${topicDescription ? `설명: ${topicDescription}` : ''}

각 반 의견:
${subsText}

위 의견들을 회의록 형식으로 자연스럽게 정리해주세요.

정리 기준:
- 한국어로만 작성
- 비슷한 의견끼리 묶기
- 원문에 없는 내용 추가하지 않기
- 의견 내용이 충분히 드러나도록 정리하기
- 과하게 짧게 줄이지 않기
- 영어 사용하지 않기
- 마크다운 문법(**,# 등) 사용하지 않기
- 안내 문장 없이 바로 결과부터 작성하기

출력 형식:

[카테고리명]
- 의견
- 의견

[카테고리명]
- 의견
- 의견
`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  const { topicId } = req.body

  const [topics, allSubs, sums, settings] = await Promise.all([
    getTopics(),
    getSubs(),
    getSums(),
    getSettings()
  ])

  const topic = topics.find(t => t.id === topicId)

  if (!topic) {
    return res.status(404).json({
      error: '안건을 찾을 수 없습니다.'
    })
  }

  const submissions = allSubs.filter(
    s => s.topicId === topicId
  )

  if (submissions.length === 0) {
    return res.status(400).json({
      error: '제출된 의견이 없습니다.'
    })
  }

  const {
    aiProvider,
    claudeApiKey,
    geminiApiKey
  } = settings

  const prompt = buildPrompt(
    topic.title,
    topic.description,
    submissions
  )

  let summaryText = ''

  try {
    if (aiProvider === 'gemini') {
      if (!geminiApiKey) {
        return res.status(400).json({
          error:
            '설정에서 Gemini API 키를 먼저 입력해주세요.'
        })
      }

      const genAI = new GoogleGenerativeAI(
        geminiApiKey
      )

      const model = genAI.getGenerativeModel({
        model: 'gemini-3.5-flash'
      })

      const result = await model.generateContent(
        prompt
      )

      summaryText = result.response.text()
    } else {
      if (!claudeApiKey) {
        return res.status(400).json({
          error:
            '설정에서 Claude API 키를 먼저 입력해주세요.'
        })
      }

      const client = new Anthropic({
        apiKey: claudeApiKey
      })

      const message =
        await client.messages.create({
          model: 'claude-sonnet-4-6',,
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })

      summaryText = message.content[0].text
    }
  } catch (err) {
    console.error('AI 오류:', err)

    const isAuthError =
      err.status === 401 ||
      err.status === 403 ||
      (err.message || '')
        .toLowerCase()
        .includes('api key')

    return res.status(500).json({
      error: isAuthError
        ? 'API 키가 올바르지 않습니다. 설정에서 확인해주세요.'
        : `AI 요약 실패: ${err.message}`
    })
  }

  const existingIdx = sums.findIndex(
    s => s.topicId === topicId
  )

  const summary = {
    id:
      existingIdx >= 0
        ? sums[existingIdx].id
        : uuidv4(),
    topicId,
    summary: summaryText,
    aiProvider,
    submissionCount: submissions.length,
    createdAt: new Date().toISOString()
  }

  if (existingIdx >= 0) {
    sums[existingIdx] = summary
  } else {
    sums.push(summary)
  }

  const topicIdx = topics.findIndex(
    t => t.id === topicId
  )

  if (topicIdx >= 0) {
    topics[topicIdx].status = 'completed'
  }

  await Promise.all([
    setSums(sums),
    setTopics(topics)
  ])

  res.json(summary)
}
