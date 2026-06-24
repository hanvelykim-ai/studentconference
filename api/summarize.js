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

function buildPrompt(topicTitle, topicDescription, submissions, category) {
  const subsText = submissions
    .sort((a, b) => a.grade - b.grade || a.class - b.class)
    .map(
      s => `[${s.grade}학년 ${s.class}반]
${s.content}`
    )
    .join('\n\n---\n\n')

  const isSuggestion = category === '건의사항'

  const categoryRuleBlock = category === '협의사항'
    ? `\n[필수 규칙 - 반드시 지킬 것]\n이 안건은 협의사항입니다. 학생들이 스스로 지킬 내용만 다룹니다.\n학교나 교사에게 무언가를 요청/건의하는 내용(예: "~해주세요", "~설치해주세요", "~지원해주세요")이 보이면, 그 의견 전체를 통째로 삭제하세요. 절대 요약에 포함하지 마세요.\n`
    : category === '건의사항'
    ? `\n[필수 규칙 - 반드시 지킬 것]\n이 안건은 건의사항이며, 학교(교직원)에게 전달되는 공식 문서입니다.\n1. 다음 기준으로 의견을 구분하세요: 학교가 시설/물품/일정/프로그램에 대해 조치해야 하는 내용(설치, 보수, 개설, 시간 조정 등)만 건의사항에 해당합니다. 학생 개개인의 행동, 습관, 예절, 안전수칙 준수처럼 학생이 스스로 지켜야 하는 내용은 건의사항이 아닙니다.\n2. 학생이 스스로 지켜야 할 내용이 "~하지 않도록 지도해주세요", "~하지 않게 교육해주세요", "~을 지키도록 해주세요"처럼 학교에 요청하는 형태로 바뀌어 적혀 있더라도, 본질은 학생 행동 규칙이므로 절대 포함하지 말고 통째로 삭제하세요. 형태를 바꿔서 남기지 마세요.\n3. 모든 문장은 반드시 "~해 주시기 바랍니다", "~해 주시면 감사하겠습니다", "~를 부탁드립니다" 중 하나의 어미로 끝내세요.\n4. "~해달라", "~요청한다", "~해주세요", "~해달라고 한다" 같은 표현은 절대 사용하지 마세요.\n`
    : category === '이달의안건'
    ? `\n[필수 규칙 - 반드시 지킬 것]\n의견 중 학교(행정실, 교직원 등)의 협조나 조치가 필요한 내용은 다른 의견들과 분리해서 [학교 차원 협조 사항] 항목으로 따로 정리하세요. 해당 항목에 들어갈 내용이 없으면 이 항목 자체를 출력하지 마세요.\n`
    : ''

  const lengthRule = isSuggestion
    ? '- 한 줄은 정중한 완성된 문장으로 작성 (간결함보다 예의 바른 표현을 우선)'
    : '- 한 줄은 짧고 명확하게 (한 문장 이내)'

  const outputExample = isSuggestion
    ? `[건의사항]\n- (예시) 급식실 앞 정수기가 자주 고장 나니 점검을 부탁드립니다.\n- (예시) 운동장 그늘막을 추가로 설치해 주시면 감사하겠습니다.`
    : `[카테고리명]\n- 의견\n- 의견${category === '이달의안건' ? `\n\n[학교 차원 협조 사항]\n- 의견\n- 의견` : ''}`

  return `
다음은 초등학교 학생자치회 회의 결과입니다.

주제: ${topicTitle}
${topicDescription ? `설명: ${topicDescription}` : ''}

각 반 의견:
${subsText}
${categoryRuleBlock}
위 의견들을 회의록 형식으로 자연스럽게 정리해주세요.

정리 기준:
- 한국어로만 작성
- 같거나 비슷한 의견은 반드시 하나로 합쳐서 정리하기 (중복 나열 금지)
- 각 카테고리별로 핵심 의견만 최대 5개 이내로 추리기
${lengthRule}
- 원문에 없는 내용 추가하지 않기
- 영어 사용하지 않기
- 마크다운 문법(**,# 등) 사용하지 않기
- 안내 문장 없이 바로 결과부터 작성하기

출력 형식 (반드시 이 스타일을 따를 것):

${outputExample}
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
    submissions,
    topic.category
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
        model: 'gemini-2.5-pro'
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
          model: 'claude-sonnet-4-6',
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
