import { useState, useEffect, useCallback } from 'react'

function Header({ user, onBack, onLogout, onRefresh }) {
  return (
    <div style={{
      background: 'var(--color-background-paper)',
      borderBottom: '1.5px solid var(--color-border-stone)',
      padding: '14px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 50
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onBack
          ? <button className="btn-ghost" onClick={onBack}>← 목록</button>
          : <span style={{ fontWeight: 700, fontSize: '17px' }}>
              {user.grade}학년 {user.class}반
            </span>
        }
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {onRefresh && (
          <button className="btn-secondary" onClick={onRefresh} style={{ padding: '8px 14px', fontSize: '13px' }}>
            새로고침
          </button>
        )}
        <button className="btn-secondary" onClick={onLogout} style={{ padding: '8px 14px', fontSize: '13px' }}>
          나가기
        </button>
      </div>
    </div>
  )
}

export default function Student({ user, onLogout }) {
  const [topics, setTopics]        = useState([])
  const [mySubmissions, setMySubs] = useState([])
  const [selected, setSelected]    = useState(null)
  const [summary, setSummary]      = useState(null)
  const [content, setContent]      = useState('')
  const [loading, setLoading]      = useState(true)
  const [saving, setSaving]        = useState(false)
  const [saved, setSaved]          = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [tRes, sRes] = await Promise.all([
        fetch('/api/topics'),
        fetch(`/api/submissions?grade=${user.grade}&class=${user.class}`)
      ])
      const tData = await tRes.json()
      const sData = await sRes.json()
      setTopics(Array.isArray(tData) ? tData : [])
      setMySubs(Array.isArray(sData) ? sData : [])
    } catch {
      setTopics([])
    } finally {
      setLoading(false)
    }
  }, [user.grade, user.class])

  useEffect(() => { load() }, [load])

  function getSub(topicId) {
    return mySubmissions.find(s => s.topicId === topicId)
  }

  async function openTopic(topic) {
    setSelected(topic)
    setSummary(null)
    setSaved(false)
    const ex = getSub(topic.id)
    setContent(ex ? ex.content : '')

    if (topic.status === 'completed') {
      const r = await fetch(`/api/summaries/${topic.id}`)
      if (r.ok) setSummary(await r.json())
    }
  }

  async function submit() {
    if (!content.trim() || saving) return
    setSaving(true)
    try {
      await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: selected.id,
          grade: user.grade,
          class: user.class,
          content: content.trim()
        })
      })
      await load()
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const activeTopics = topics.filter(t => t.status === 'active')
  const doneTopics   = topics.filter(t => t.status === 'completed')

  /* ── Topic detail view ── */
  if (selected) {
    const existingSub  = getSub(selected.id)
    const isCompleted  = selected.status === 'completed'

    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-canvas-oat)' }}>
        <Header user={user} onBack={() => { setSelected(null); setSaved(false); setSummary(null) }} onLogout={onLogout} />
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Topic title */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                {selected.title}
              </h2>
              {isCompleted && <span className="badge badge-green">요약 완료</span>}
            </div>
            {selected.description && (
              <p style={{ color: '#666', fontSize: '15px', lineHeight: 1.6 }}>
                {selected.description}
              </p>
            )}
          </div>

          {/* AI 요약 결과 (완료된 안건만) */}
          {isCompleted && (
            <div className="card" style={{ borderColor: 'var(--color-action-sky)', borderWidth: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px' }}>🤖</span>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700 }}>전체 의견 요약</h3>
                  {summary && (
                    <p style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>
                      {summary.submissionCount}개 반 의견 기반
                    </p>
                  )}
                </div>
              </div>

              {summary ? (
                <div style={{ background: 'var(--color-canvas-oat)', borderRadius: '20px', padding: '20px 22px' }}>
                  <p className="summary-text">{summary.summary}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#aaa', padding: '8px 0' }}>
                  <span className="spinner" />
                  <span style={{ fontSize: '14px' }}>요약 불러오는 중...</span>
                </div>
              )}
            </div>
          )}

          {/* 우리 반 제출 내용 */}
          <div className="card">
            <p style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
              {user.grade}학년 {user.class}반 회의 결과
            </p>

            {saved && (
              <div className="alert alert-success" style={{ marginBottom: '14px' }}>
                ✓ 성공적으로 제출되었습니다.
              </div>
            )}

            {!isCompleted && existingSub && !saved && (
              <div className="alert alert-info" style={{ marginBottom: '14px' }}>
                이미 제출된 내용이 있습니다. 수정 후 다시 제출할 수 있습니다.
              </div>
            )}

            {isCompleted && !existingSub && (
              <div className="alert alert-warning" style={{ marginBottom: '14px' }}>
                이 안건에 제출한 내용이 없습니다.
              </div>
            )}

            <textarea
              className="textarea"
              value={content}
              onChange={e => setContent(e.target.value)}
              disabled={isCompleted}
              placeholder={`우리 반 회의에서 나온 의견을 적어주세요.\n여러 의견은 번호를 매겨 정리하면 좋습니다.\n예)\n1. 체육대회 종목에 계주를 넣으면 좋겠다\n2. 응원 도구를 각 반이 직접 만들었으면 한다`}
              style={{ marginBottom: isCompleted ? 0 : '16px', minHeight: '160px', opacity: isCompleted ? 0.65 : 1 }}
            />

            {!isCompleted && (
              <button
                className="btn-primary"
                onClick={submit}
                disabled={!content.trim() || saving}
                style={{ width: '100%', fontSize: '16px', padding: '18px' }}
              >
                {saving ? <><span className="spinner" /> 제출 중...</> : existingSub ? '수정하여 다시 제출' : '제출하기'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ── Topic list view ── */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-canvas-oat)' }}>
      <Header user={user} onLogout={onLogout} onRefresh={load} />
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px' }}>

        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '4px' }}>
            회의 안건
          </h2>
          <p style={{ color: '#888', fontSize: '14px' }}>
            각 안건을 클릭해서 우리 반 의견을 입력해요
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <span className="spinner" />
          </div>
        ) : topics.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '56px 32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <p style={{ fontWeight: 700, marginBottom: '6px' }}>아직 안건이 없어요</p>
            <p style={{ color: '#888', fontSize: '14px' }}>선생님이 안건을 등록하면 여기에 표시돼요</p>
          </div>
        ) : (
          <>
            {activeTopics.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#888', letterSpacing: '0.05em', marginBottom: '12px', textTransform: 'uppercase' }}>
                  진행 중인 안건
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activeTopics.map(topic => {
                    const submitted = !!getSub(topic.id)
                    return (
                      <button
                        key={topic.id}
                        onClick={() => openTopic(topic)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          background: 'var(--color-background-paper)',
                          borderRadius: '24px',
                          padding: '22px 24px',
                          border: submitted ? '2px solid #86efac' : '1.5px solid var(--color-border-stone)',
                          cursor: 'pointer',
                          transition: 'transform 0.1s',
                          outline: 'none'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: topic.description ? '6px' : 0, letterSpacing: '-0.01em' }}>
                              {topic.title}
                            </h3>
                            {topic.description && (
                              <p style={{
                                color: '#777', fontSize: '14px', lineHeight: 1.5,
                                display: '-webkit-box', WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical', overflow: 'hidden'
                              }}>
                                {topic.description}
                              </p>
                            )}
                          </div>
                          <span className={`badge ${submitted ? 'badge-green' : 'badge-gray'}`} style={{ flexShrink: 0, marginTop: '2px' }}>
                            {submitted ? '✓ 제출완료' : '미제출'}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {doneTopics.length > 0 && (
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#888', letterSpacing: '0.05em', marginBottom: '12px', textTransform: 'uppercase' }}>
                  요약 완료된 안건
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {doneTopics.map(topic => {
                    const submitted = !!getSub(topic.id)
                    return (
                      <button
                        key={topic.id}
                        onClick={() => openTopic(topic)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          background: 'var(--color-background-paper)',
                          borderRadius: '24px',
                          padding: '22px 24px',
                          border: '2px solid var(--color-action-sky)',
                          cursor: 'pointer',
                          transition: 'transform 0.1s',
                          outline: 'none'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.01em', marginBottom: '6px' }}>
                              {topic.title}
                            </h3>
                            <p style={{ fontSize: '13px', color: '#72a4f2', fontWeight: 600 }}>
                              🤖 요약 결과 보기
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                            {submitted && <span className="badge badge-green">✓ 제출</span>}
                            <span className="badge badge-blue">요약완료</span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
