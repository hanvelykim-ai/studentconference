import { useState, useEffect, useCallback } from 'react'

function Header({ title, onBack, onLogout, extra }) {
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
        {onBack && <button className="btn-ghost" onClick={onBack}>←</button>}
        <span style={{ fontWeight: 700, fontSize: '17px' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {extra}
        <button className="btn-secondary" onClick={onLogout} style={{ padding: '8px 14px', fontSize: '13px' }}>
          나가기
        </button>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: 'var(--color-background-paper)',
      borderRadius: '20px',
      padding: '18px 20px',
      border: '1.5px solid var(--color-border-stone)',
      flex: 1
    }}>
      <p style={{ fontSize: '12px', fontWeight: 700, color: '#aaa', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px' }}>
        {label}
      </p>
      <p style={{ fontSize: '26px', fontWeight: 900, color: color || 'var(--color-text-ink)', letterSpacing: '-0.02em' }}>
        {value}
      </p>
    </div>
  )
}

export default function Teacher({ onLogout }) {
  const [view, setView]           = useState('dashboard')
  const [topics, setTopics]       = useState([])
  const [submissions, setSubs]    = useState([])
  const [summaries, setSummaries] = useState({})
  const [selected, setSelected]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const [summarizing, setSummarizing] = useState(false)
  const [summaryError, setSummaryError] = useState('')

  // Create topic
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc]   = useState('')
  const [creating, setCreating] = useState(false)

  // Settings
  const [claudeKey, setClaudeKey]   = useState('')
  const [geminiKey, setGeminiKey]   = useState('')
  const [newPin, setNewPin]         = useState('')
  const [aiProvider, setAiProvider] = useState('claude')
  const [hasClaudeKey, setHasClaudeKey] = useState(false)
  const [hasGeminiKey, setHasGeminiKey] = useState(false)
  const [settingMsg, setSettingMsg] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [tRes, sRes, cfgRes] = await Promise.all([
        fetch('/api/topics'),
        fetch('/api/submissions'),
        fetch('/api/settings')
      ])
      const tData  = await tRes.json()
      const sData  = await sRes.json()
      const cfgData = await cfgRes.json()

      setTopics(Array.isArray(tData) ? tData : [])
      setSubs(Array.isArray(sData) ? sData : [])
      setHasClaudeKey(cfgData.hasClaudeKey)
      setHasGeminiKey(cfgData.hasGeminiKey)
      setAiProvider(cfgData.aiProvider || 'claude')

      // Load summaries for completed topics
      const completed = (Array.isArray(tData) ? tData : []).filter(t => t.status === 'completed')
      const sumMap = {}
      await Promise.all(completed.map(async t => {
        const r = await fetch(`/api/summaries/${t.id}`)
        if (r.ok) sumMap[t.id] = await r.json()
      }))
      setSummaries(sumMap)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  function getTopicSubs(topicId) {
    return submissions.filter(s => s.topicId === topicId)
  }

  async function createTopic() {
    if (!newTitle.trim() || creating) return
    setCreating(true)
    try {
      await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim() })
      })
      setNewTitle(''); setNewDesc('')
      await loadData()
      setView('dashboard')
    } finally {
      setCreating(false)
    }
  }

  async function deleteTopic(id) {
    await fetch(`/api/topics/${id}`, { method: 'DELETE' })
    setConfirmDelete(null)
    if (selected?.id === id) { setSelected(null); setView('dashboard') }
    await loadData()
  }

  async function summarize(topic) {
    setSummarizing(true)
    setSummaryError('')
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: topic.id })
      })
      const data = await res.json()
      if (data.error) {
        setSummaryError(data.error)
      } else {
        await loadData()
      }
    } catch {
      setSummaryError('서버 오류가 발생했습니다.')
    } finally {
      setSummarizing(false)
    }
  }

  async function saveSettings() {
    const body = { aiProvider }
    if (claudeKey.trim()) body.claudeApiKey = claudeKey.trim()
    if (geminiKey.trim()) body.geminiApiKey = geminiKey.trim()
    if (newPin.trim())    body.teacherPin   = newPin.trim()
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    setClaudeKey(''); setGeminiKey(''); setNewPin('')
    await loadData()
    setSettingMsg('설정이 저장되었습니다.')
    setTimeout(() => setSettingMsg(''), 3000)
  }

  // ── Settings ────────────────────────────────────────────
  if (view === 'settings') {
    const activeKeyOk = aiProvider === 'claude' ? hasClaudeKey : hasGeminiKey

    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-canvas-oat)' }}>
        <Header title="설정" onBack={() => setView('dashboard')} onLogout={onLogout} />
        <div style={{ maxWidth: '520px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* AI 제공사 선택 */}
          <div className="card">
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>AI 제공사 선택</h3>
            <p style={{ color: '#777', fontSize: '14px', marginBottom: '14px' }}>
              요약에 사용할 AI를 선택하세요. 선택한 제공사의 API 키가 설정되어 있어야 합니다.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { id: 'claude', label: 'Claude', sub: 'Anthropic', hasKey: hasClaudeKey, color: '#7c3aed' },
                { id: 'gemini', label: 'Gemini', sub: 'Google',    hasKey: hasGeminiKey, color: '#1d4ed8' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setAiProvider(opt.id)}
                  style={{
                    flex: 1,
                    padding: '16px',
                    borderRadius: '20px',
                    border: aiProvider === opt.id
                      ? `2px solid ${opt.color}`
                      : '2px solid var(--color-border-stone)',
                    background: aiProvider === opt.id ? `${opt.color}12` : 'var(--color-background-paper)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    fontFamily: 'var(--font-main)'
                  }}
                >
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-ink)', marginBottom: '4px' }}>
                    {aiProvider === opt.id ? '✓ ' : ''}{opt.label}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{opt.sub}</div>
                  <div style={{ fontSize: '12px', marginTop: '6px', color: opt.hasKey ? '#15803d' : '#aaa', fontWeight: 600 }}>
                    {opt.hasKey ? '키 설정됨' : '키 없음'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Claude API 키 */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Claude API 키</h3>
              {hasClaudeKey
                ? <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 700 }}>✓ 설정됨</span>
                : <span style={{ fontSize: '12px', color: '#aaa' }}>미설정</span>}
            </div>
            <p style={{ color: '#777', fontSize: '13px', marginBottom: '12px' }}>
              Anthropic Console에서 발급 · sk-ant-...
            </p>
            <input
              className="input"
              type="password"
              placeholder={hasClaudeKey ? '새 키를 입력하면 교체됩니다' : 'sk-ant-...'}
              value={claudeKey}
              onChange={e => setClaudeKey(e.target.value)}
            />
          </div>

          {/* Gemini API 키 */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Gemini API 키</h3>
              {hasGeminiKey
                ? <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 700 }}>✓ 설정됨</span>
                : <span style={{ fontSize: '12px', color: '#aaa' }}>미설정</span>}
            </div>
            <p style={{ color: '#777', fontSize: '13px', marginBottom: '12px' }}>
              Google AI Studio에서 발급 · AIza...
            </p>
            <input
              className="input"
              type="password"
              placeholder={hasGeminiKey ? '새 키를 입력하면 교체됩니다' : 'AIza...'}
              value={geminiKey}
              onChange={e => setGeminiKey(e.target.value)}
            />
          </div>

          {/* PIN */}
          <div className="card">
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>교사 PIN 변경</h3>
            <p style={{ color: '#777', fontSize: '13px', marginBottom: '12px' }}>
              교사 모드 진입 PIN을 변경합니다
            </p>
            <input
              className="input"
              type="password"
              placeholder="새 PIN 번호"
              value={newPin}
              onChange={e => setNewPin(e.target.value)}
            />
          </div>

          {!activeKeyOk && (
            <div className="alert alert-warning">
              현재 선택된 AI({aiProvider === 'claude' ? 'Claude' : 'Gemini'})의 API 키가 설정되지 않았습니다.
            </div>
          )}
          {settingMsg && <div className="alert alert-success">{settingMsg}</div>}

          <button
            className="btn-primary"
            onClick={saveSettings}
            style={{ width: '100%', fontSize: '16px', padding: '18px' }}
          >
            저장하기
          </button>
        </div>
      </div>
    )
  }

  // ── Create topic ─────────────────────────────────────────
  if (view === 'create') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-canvas-oat)' }}>
        <Header title="새 안건 등록" onBack={() => setView('dashboard')} onLogout={onLogout} />
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '24px 16px' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
                안건 제목 <span style={{ color: 'var(--color-icon-ember)' }}>*</span>
              </label>
              <input
                className="input"
                placeholder="예: 수련회 장소 의견 수렴"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createTopic()}
                autoFocus
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
                안건 설명 <span style={{ color: '#bbb', fontWeight: 400 }}>(선택)</span>
              </label>
              <textarea
                className="textarea"
                placeholder="안건에 대한 추가 설명을 입력해주세요"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                style={{ minHeight: '100px' }}
              />
            </div>
            <button
              className="btn-primary"
              onClick={createTopic}
              disabled={!newTitle.trim() || creating}
              style={{ fontSize: '16px', padding: '18px' }}
            >
              {creating ? <><span className="spinner" /> 등록 중...</> : '안건 등록하기'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Topic detail ─────────────────────────────────────────
  if (view === 'detail' && selected) {
    const currentTopic = topics.find(t => t.id === selected.id) || selected
    const topicSubs    = getTopicSubs(currentTopic.id)
    const summary      = summaries[currentTopic.id]
    const isCompleted  = currentTopic.status === 'completed'

    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-canvas-oat)' }}>
        <Header
          title={currentTopic.title}
          onBack={() => { setView('dashboard'); setSummaryError('') }}
          onLogout={onLogout}
        />
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Status + action */}
          <div className="card">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '14px' }}>
              <span className={`badge ${isCompleted ? 'badge-green' : 'badge-blue'}`}>
                {isCompleted ? '✓ 요약 완료' : '진행 중'}
              </span>
              <span className="badge badge-gray">{topicSubs.length}개 반 제출</span>
            </div>

            {currentTopic.description && (
              <p style={{ color: '#666', fontSize: '15px', lineHeight: 1.6, marginBottom: '16px' }}>
                {currentTopic.description}
              </p>
            )}

            {!(aiProvider === 'claude' ? hasClaudeKey : hasGeminiKey) && (
              <div className="alert alert-warning" style={{ marginBottom: '14px' }}>
                ⚠️ {aiProvider === 'claude' ? 'Claude' : 'Gemini'} API 키가 없습니다.{' '}
                <button
                  onClick={() => setView('settings')}
                  style={{ background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'var(--font-main)', color: '#854d0e' }}
                >
                  설정에서 입력
                </button>
                해주세요.
              </div>
            )}

            {summaryError && (
              <div className="alert alert-error" style={{ marginBottom: '14px' }}>{summaryError}</div>
            )}

            <button
              className="btn-primary"
              onClick={() => summarize(currentTopic)}
              disabled={summarizing || topicSubs.length === 0 || !(aiProvider === 'claude' ? hasClaudeKey : hasGeminiKey)}
              style={{ width: '100%', fontSize: '16px', padding: '18px' }}
            >
              {summarizing
                ? <><span className="spinner" /> AI가 요약 중입니다...</>
                : isCompleted ? '🔄 AI로 다시 요약하기' : '🤖 AI로 의견 요약하기'}
            </button>
          </div>

          {/* AI Summary */}
          {summary && (
            <div className="card" style={{ borderColor: 'var(--color-action-sky)', borderWidth: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '24px' }}>🤖</span>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700 }}>AI 요약 결과</h3>
                  <p style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>
                    {new Date(summary.createdAt).toLocaleString('ko-KR')} · {summary.submissionCount}개 반 의견 기반
                    {summary.aiProvider && ` · ${summary.aiProvider === 'gemini' ? 'Gemini' : 'Claude'} 요약`}
                  </p>
                </div>
              </div>
              <div style={{
                background: 'var(--color-canvas-oat)',
                borderRadius: '20px',
                padding: '20px 22px'
              }}>
                <p className="summary-text">{summary.summary}</p>
              </div>
            </div>
          )}

          {/* All submissions */}
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '12px' }}>
              각 반 제출 현황
            </h3>

            {topicSubs.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: '#888' }}>아직 제출된 의견이 없습니다</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topicSubs
                  .sort((a, b) => a.grade - b.grade || a.class - b.class)
                  .map(sub => (
                    <div key={sub.id} className="card" style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <span className="badge badge-sky">
                          {sub.grade}학년 {sub.class}반
                        </span>
                        <span style={{ fontSize: '12px', color: '#bbb' }}>
                          {new Date(sub.updatedAt || sub.submittedAt).toLocaleString('ko-KR')}
                          {sub.updatedAt ? ' (수정됨)' : ''}
                        </span>
                      </div>
                      <p style={{ fontSize: '15px', lineHeight: 1.75, whiteSpace: 'pre-wrap', color: 'var(--color-text-ink)' }}>
                        {sub.content}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Danger zone */}
          <div style={{ borderTop: '1.5px solid var(--color-border-stone)', paddingTop: '16px' }}>
            <button
              onClick={() => setConfirmDelete(currentTopic)}
              style={{
                background: 'none',
                border: '1.5px solid #fca5a5',
                borderRadius: '9999px',
                padding: '10px 20px',
                color: '#ef4444',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'var(--font-main)',
                fontWeight: 600
              }}
            >
              이 안건 삭제
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Dashboard ─────────────────────────────────────────────
  const activeTopics = topics.filter(t => t.status === 'active')
  const doneTopics   = topics.filter(t => t.status === 'completed')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-canvas-oat)' }}>
      <Header
        title="교사 대시보드"
        onLogout={onLogout}
        extra={
          <button
            className="btn-secondary"
            onClick={() => setView('settings')}
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            ⚙️ 설정
          </button>
        }
      />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Stats */}
        {!loading && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <StatCard label="전체 안건" value={topics.length} />
            <StatCard label="진행 중" value={activeTopics.length} color="var(--color-action-sky)" />
            <StatCard label="요약 완료" value={doneTopics.length} color="#15803d" />
            <StatCard label="총 제출" value={submissions.length} />
          </div>
        )}

        {/* API key warning */}
        {!loading && !(aiProvider === 'claude' ? hasClaudeKey : hasGeminiKey) && (
          <div className="alert alert-warning" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠️ {aiProvider === 'claude' ? 'Claude' : 'Gemini'} API 키를 설정해야 요약이 가능합니다</span>
            <button
              onClick={() => setView('settings')}
              style={{
                background: 'none',
                border: '1.5px solid #92400e',
                borderRadius: '9999px',
                padding: '4px 12px',
                color: '#92400e',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-main)'
              }}
            >
              설정하기
            </button>
          </div>
        )}

        {/* New topic button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em' }}>안건 목록</h2>
          <button
            className="btn-primary"
            onClick={() => setView('create')}
            style={{ padding: '12px 22px' }}
          >
            + 새 안건
          </button>
        </div>

        {/* Topics */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <span className="spinner" />
          </div>
        ) : topics.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '56px 32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <p style={{ fontWeight: 700, marginBottom: '6px' }}>등록된 안건이 없어요</p>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
              새 안건을 등록하면 학생들이 의견을 입력할 수 있어요
            </p>
            <button className="btn-primary" onClick={() => setView('create')}>
              + 첫 안건 등록하기
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...activeTopics, ...doneTopics].map(topic => {
              const subs    = getTopicSubs(topic.id)
              const hasSummary = !!summaries[topic.id]
              const isCompleted = topic.status === 'completed'

              return (
                <div key={topic.id} className="card" style={{ opacity: isCompleted ? 0.75 : 1, padding: '22px 26px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.01em' }}>
                          {topic.title}
                        </h3>
                        {isCompleted && <span className="badge badge-green">완료</span>}
                        {hasSummary && !isCompleted && <span className="badge badge-blue">요약있음</span>}
                      </div>
                      {topic.description && (
                        <p style={{
                          color: '#777', fontSize: '14px', lineHeight: 1.5, marginBottom: '10px',
                          display: '-webkit-box', WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}>
                          {topic.description}
                        </p>
                      )}
                      <p style={{ fontSize: '13px', color: '#aaa' }}>
                        {subs.length}개 반 제출
                        {hasSummary && ' · AI 요약 완료'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button
                      className="btn-secondary"
                      onClick={() => { setSelected(topic); setView('detail'); setSummaryError('') }}
                      style={{ flex: 1, padding: '10px 16px' }}
                    >
                      자세히 보기
                    </button>
                    <button
                      onClick={() => setConfirmDelete(topic)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '9999px',
                        border: '1.5px solid #fca5a5',
                        background: 'white',
                        color: '#ef4444',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-main)',
                        fontWeight: 600
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div
          onClick={() => setConfirmDelete(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px', zIndex: 100
          }}
        >
          <div className="card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '380px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>안건 삭제</h3>
            <p style={{ color: '#555', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
              "<strong>{confirmDelete.title}</strong>" 안건과 모든 제출 내용, 요약이 삭제됩니다.
              <br />이 작업은 되돌릴 수 없습니다.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setConfirmDelete(null)} style={{ flex: 1 }}>
                취소
              </button>
              <button
                onClick={() => deleteTopic(confirmDelete.id)}
                style={{
                  flex: 2, padding: '14px', borderRadius: '9999px',
                  border: 'none', background: '#ef4444', color: 'white',
                  fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'var(--font-main)'
                }}
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
