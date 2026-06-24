import { useState, useEffect, useCallback } from 'react'
import { identityKey, classKey, identityLabel, canSeeMeetings, canCheckAttendance } from '../lib/identity.js'

/* ───────────────────────── Shared bits ───────────────────────── */

function Header({ user, onLogout }) {
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
      <span style={{ fontWeight: 700, fontSize: '16px' }}>{identityLabel(user)}</span>
      <button className="btn-secondary" onClick={onLogout} style={{ padding: '8px 14px', fontSize: '13px' }}>
        나가기
      </button>
    </div>
  )
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: '6px', padding: '10px 16px',
      background: 'var(--color-background-paper)',
      borderBottom: '1.5px solid var(--color-border-stone)',
      position: 'sticky', top: '57px', zIndex: 49, overflowX: 'auto'
    }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: '8px 16px',
            borderRadius: '9999px',
            border: 'none',
            background: active === t.id ? 'var(--color-action-sky)' : 'transparent',
            color: 'var(--color-text-ink)',
            fontWeight: 700,
            fontSize: '14px',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-main)'
          }}
        >
          {t.emoji} {t.label}
        </button>
      ))}
    </div>
  )
}

function formatDate(d) {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date)) return d
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}

/* ───────────────────────── 홈 탭 ───────────────────────── */

function HomeTab({ user, meetings, elections, todos, onToggleTodo }) {
  const myKey = identityKey(user)
  const myTodos = todos.filter(t => (t.assignedTo || []).includes(myKey))
  const undone = myTodos.filter(t => !(t.completedBy || []).includes(myKey))

  const nextMeeting = meetings
    .slice().sort((a, b) => new Date(a.date) - new Date(b.date))[0]
  const nextElection = elections
    .slice().sort((a, b) => new Date(a.date) - new Date(b.date))[0]

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em' }}>
        안녕하세요 👋
      </h2>

      <div className="card">
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#888', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          다가오는 회의
        </p>
        {nextMeeting ? (
          <>
            <p style={{ fontWeight: 700, fontSize: '16px' }}>{nextMeeting.title}</p>
            <p style={{ color: '#999', fontSize: '14px' }}>{formatDate(nextMeeting.date)} {nextMeeting.time} {nextMeeting.location}</p>
          </>
        ) : <p style={{ color: '#aaa', fontSize: '14px' }}>예정된 회의가 없어요</p>}
      </div>

      <div className="card">
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#888', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          다가오는 선거
        </p>
        {nextElection ? (
          <>
            <p style={{ fontWeight: 700, fontSize: '16px' }}>{nextElection.title}</p>
            <p style={{ color: '#999', fontSize: '14px' }}>{formatDate(nextElection.date)}</p>
          </>
        ) : <p style={{ color: '#aaa', fontSize: '14px' }}>예정된 선거가 없어요</p>}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            내 할 일
          </p>
          <span className="badge badge-sky">{undone.length}개 남음</span>
        </div>
        {myTodos.length === 0 ? (
          <p style={{ color: '#aaa', fontSize: '14px' }}>받은 할 일이 없어요</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {myTodos.slice(0, 4).map(t => {
              const done = (t.completedBy || []).includes(myKey)
              return (
                <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={done} onChange={() => onToggleTodo(t.id)} style={{ width: '18px', height: '18px' }} />
                  <span style={{ fontSize: '15px', textDecoration: done ? 'line-through' : 'none', color: done ? '#bbb' : 'inherit' }}>
                    {t.title}
                  </span>
                </label>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ───────────────────────── 회의 탭 ───────────────────────── */

function MeetingsTab({ user, meetings, onToggleAttendance }) {
  const canCheck = canCheckAttendance(user)
  const myClassKey = classKey(user)

  const isChecked = m => (m.attendance || []).some(a => `${a.grade}-${a.class}` === myClassKey)

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '6px' }}>전교 회의 일정</h2>
      <p style={{ color: '#888', fontSize: '14px', marginBottom: '20px' }}>
        {canCheck ? '반대표가 우리 반 참여 여부를 체크해주세요' : '예정된 전교 회의를 확인해요'}
      </p>

      {meetings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ color: '#888' }}>등록된 회의 일정이 없어요</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {meetings.map(m => {
            const checked = canCheck && isChecked(m)
            return (
              <div key={m.id} className="card" style={{ padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '16px' }}>{m.title}</p>
                    <p style={{ color: '#999', fontSize: '14px', marginTop: '4px' }}>
                      {formatDate(m.date)} {m.time} {m.location && `· ${m.location}`}
                    </p>
                  </div>
                  {canCheck && (
                    <button
                      onClick={() => onToggleAttendance(m.id)}
                      className={checked ? 'badge badge-green' : 'badge badge-gray'}
                      style={{ border: 'none', cursor: 'pointer', fontFamily: 'var(--font-main)' }}
                    >
                      {checked ? '✓ 참여 체크됨' : '참여 체크하기'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ───────────────────────── 할일 탭 ───────────────────────── */

function TodosTab({ user, todos, onToggleTodo }) {
  const myKey = identityKey(user)
  const myTodos = todos.filter(t => (t.assignedTo || []).includes(myKey))
    .sort((a, b) => new Date(a.dueDate || a.createdAt) - new Date(b.dueDate || b.createdAt))

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '6px' }}>내 할 일</h2>
      <p style={{ color: '#888', fontSize: '14px', marginBottom: '20px' }}>선생님이 등록한 할 일이에요</p>

      {myTodos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ color: '#888' }}>받은 할 일이 없어요</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {myTodos.map(t => {
            const done = (t.completedBy || []).includes(myKey)
            return (
              <div key={t.id} className="card" style={{ padding: '20px 22px', opacity: done ? 0.6 : 1 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={done} onChange={() => onToggleTodo(t.id)} style={{ width: '20px', height: '20px', marginTop: '2px' }} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '16px', textDecoration: done ? 'line-through' : 'none' }}>{t.title}</p>
                    {t.description && <p style={{ color: '#777', fontSize: '14px', marginTop: '4px' }}>{t.description}</p>}
                    {t.dueDate && <p style={{ color: '#aaa', fontSize: '13px', marginTop: '4px' }}>기한: {formatDate(t.dueDate)}</p>}
                  </div>
                </label>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ───────────────────────── 안건 탭 (반대표 전용) ───────────────────────── */

function TopicsTab({ user }) {
  const [topics, setTopics]        = useState([])
  const [mySubmissions, setMySubs] = useState([])
  const [selected, setSelected]    = useState(null)
  const [summary, setSummary]      = useState(null)
  const [items, setItems]          = useState([''])
  const [loading, setLoading]      = useState(true)
  const [saving, setSaving]        = useState(false)
  const [saved, setSaved]          = useState(false)
  const [categoryWarning, setCategoryWarning] = useState('')

  const CATEGORIES = [
    { id: '협의사항', label: '협의사항', emoji: '🤝', desc: '학생들이 함께 지킬 내용' },
    { id: '건의사항', label: '건의사항', emoji: '📣', desc: '학교에서 해결해줄 내용' },
    { id: '이달의안건', label: '이 달의 안건', emoji: '📅', desc: '이번 달 주요 안건' }
  ]

  function checkMismatch(itemList, category) {
    if (!category) return ''
    const text = itemList.join(' ').toLowerCase()
    const 건의kw = ['해주세요', '해달라', '해줬으면', '요청', '설치해', '지원해', '제공해', '부탁', '개선해', '고쳐', '바꿔']
    const 협의kw = ['우리가', '함께', '지키자', '약속', '규칙', '정하자', '스스로']
    if (category === '협의사항' && 건의kw.some(k => text.includes(k)))
      return '⚠️ 이 안건은 협의사항이에요. 학생들이 스스로 지킬 내용을 적어주세요.'
    if (category === '건의사항' && 협의kw.some(k => text.includes(k)))
      return '⚠️ 이 안건은 건의사항이에요. 학교에 요청할 내용을 적어주세요.'
    return ''
  }

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
    setCategoryWarning('')
    const ex = getSub(topic.id)
    if (ex) {
      const lines = ex.content.split('\n').filter(l => l.trim())
      setItems(lines.length > 0 ? lines : [''])
    } else {
      setItems([''])
    }
    if (topic.status === 'completed') {
      const r = await fetch(`/api/summaries/${topic.id}`)
      if (r.ok) setSummary(await r.json())
    }
  }

  function handleItemChange(idx, val) {
    const next = [...items]
    next[idx] = val
    setItems(next)
    setCategoryWarning(checkMismatch(next, selected?.category))
  }

  function handleItemKeyDown(idx, e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      const next = [...items]
      next.splice(idx + 1, 0, '')
      setItems(next)
      setTimeout(() => {
        const inputs = document.querySelectorAll('.opinion-input')
        if (inputs[idx + 1]) inputs[idx + 1].focus()
      }, 0)
    }
    if (e.key === 'Backspace' && items[idx] === '' && items.length > 1) {
      e.preventDefault()
      const next = items.filter((_, i) => i !== idx)
      setItems(next)
      setTimeout(() => {
        const inputs = document.querySelectorAll('.opinion-input')
        if (inputs[idx - 1]) inputs[idx - 1].focus()
      }, 0)
    }
  }

  function removeItem(idx) {
    if (items.length === 1) { setItems(['']); return }
    const next = items.filter((_, i) => i !== idx)
    setItems(next)
    setCategoryWarning(checkMismatch(next, selected?.category))
  }

  async function submit() {
    const filled = items.filter(i => i.trim())
    if (filled.length === 0 || saving) return
    setSaving(true)
    try {
      const content = filled.join('\n')
      await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: selected.id, grade: user.grade, class: user.class, content })
      })
      await load()
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const activeTopics = topics.filter(t => t.status === 'active')
  const doneTopics   = topics.filter(t => t.status === 'completed')

  if (selected) {
    const existingSub = getSub(selected.id)
    const isCompleted = selected.status === 'completed'
    const filledItems  = items.filter(i => i.trim())
    const cat = CATEGORIES.find(c => c.id === selected.category)

    return (
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <button className="btn-ghost" onClick={() => { setSelected(null); setSaved(false); setSummary(null); setCategoryWarning('') }}>
          ← 목록
        </button>

        <div className="card">
          {cat && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: '13px', fontWeight: 700,
              color: '#3b6fd4', background: '#f0f4ff',
              borderRadius: '9999px', padding: '4px 12px', marginBottom: '10px'
            }}>
              {cat.emoji} {cat.label}
              <span style={{ fontWeight: 400, color: '#888', fontSize: '12px' }}>· {cat.desc}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}>{selected.title}</h2>
            {isCompleted && <span className="badge badge-green">요약 완료</span>}
          </div>
          {selected.description && (
            <p style={{ color: '#666', fontSize: '15px', lineHeight: 1.6, marginTop: '8px' }}>{selected.description}</p>
          )}
        </div>

        {isCompleted && (
          <div className="card" style={{ borderColor: 'var(--color-action-sky)', borderWidth: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '22px' }}>🤖</span>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700 }}>전체 의견 요약</h3>
                {summary && <p style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>{summary.submissionCount}개 반 의견 기반</p>}
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

        <div className="card">
          <p style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>{user.grade}학년 {user.class}반 회의 결과</p>
          <p style={{ fontSize: '13px', color: '#999', marginBottom: '16px' }}>
            의견을 한 줄씩 입력하고 <kbd style={{ background: '#f0f0f0', borderRadius: '4px', padding: '1px 5px', fontSize: '12px', fontFamily: 'monospace' }}>Enter</kbd>를 누르면 다음 칸이 생겨요
          </p>

          {saved && <div className="alert alert-success" style={{ marginBottom: '14px' }}>✓ 성공적으로 제출되었습니다.</div>}
          {!isCompleted && existingSub && !saved && (
            <div className="alert alert-info" style={{ marginBottom: '14px' }}>이미 제출된 내용이 있습니다. 수정 후 다시 제출할 수 있습니다.</div>
          )}
          {isCompleted && !existingSub && (
            <div className="alert alert-warning" style={{ marginBottom: '14px' }}>이 안건에 제출한 내용이 없습니다.</div>
          )}
          {categoryWarning && <div className="alert alert-warning" style={{ marginBottom: '14px' }}>{categoryWarning}</div>}

          {isCompleted ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.65 }}>
              {items.filter(i => i.trim()).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: 'var(--color-canvas-oat)', borderRadius: '14px' }}>
                  <span style={{ color: '#bbb', fontSize: '13px', fontWeight: 700, minWidth: '20px', paddingTop: '1px' }}>{idx + 1}</span>
                  <span style={{ fontSize: '15px', lineHeight: 1.6, flex: 1 }}>{item}</span>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#bbb', fontSize: '13px', fontWeight: 700, minWidth: '20px', textAlign: 'right' }}>{idx + 1}</span>
                    <input
                      className="input opinion-input"
                      value={item}
                      onChange={e => handleItemChange(idx, e.target.value)}
                      onKeyDown={e => handleItemKeyDown(idx, e)}
                      placeholder={idx === 0 ? '의견을 입력하고 Enter를 누르세요' : '의견을 입력하세요'}
                      style={{ flex: 1, padding: '12px 16px' }}
                      autoFocus={idx === items.length - 1 && idx > 0}
                    />
                    {items.length > 1 && (
                      <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '18px', padding: '4px 6px', lineHeight: 1, flexShrink: 0 }} title="삭제">×</button>
                    )}
                  </div>
                ))}
              </div>
              <button className="btn-primary" onClick={submit} disabled={filledItems.length === 0 || saving} style={{ width: '100%', fontSize: '16px', padding: '18px' }}>
                {saving ? <><span className="spinner" /> 제출 중...</> : existingSub ? '수정하여 다시 제출' : '제출하기'}
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '4px' }}>회의 안건</h2>
          <p style={{ color: '#888', fontSize: '14px' }}>각 안건을 클릭해서 우리 반 의견을 입력해요</p>
        </div>
        <button className="btn-secondary" onClick={load} style={{ padding: '8px 14px', fontSize: '13px' }}>새로고침</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}><span className="spinner" /></div>
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
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#888', letterSpacing: '0.05em', marginBottom: '12px', textTransform: 'uppercase' }}>진행 중인 안건</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeTopics.map(topic => {
                  const submitted = !!getSub(topic.id)
                  const cat = CATEGORIES.find(c => c.id === topic.category)
                  return (
                    <button key={topic.id} onClick={() => openTopic(topic)} style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      background: 'var(--color-background-paper)', borderRadius: '24px', padding: '22px 24px',
                      border: submitted ? '2px solid #86efac' : '1.5px solid var(--color-border-stone)', cursor: 'pointer'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          {cat && (
                            <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 700, color: '#3b6fd4', background: '#f0f4ff', borderRadius: '9999px', padding: '2px 8px', marginBottom: '6px' }}>
                              {cat.emoji} {cat.label}
                            </span>
                          )}
                          <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: topic.description ? '6px' : 0, letterSpacing: '-0.01em' }}>{topic.title}</h3>
                          {topic.description && (
                            <p style={{ color: '#777', fontSize: '14px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{topic.description}</p>
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
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#888', letterSpacing: '0.05em', marginBottom: '12px', textTransform: 'uppercase' }}>요약 완료된 안건</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {doneTopics.map(topic => {
                  const submitted = !!getSub(topic.id)
                  const cat = CATEGORIES.find(c => c.id === topic.category)
                  return (
                    <button key={topic.id} onClick={() => openTopic(topic)} style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      background: 'var(--color-background-paper)', borderRadius: '24px', padding: '22px 24px',
                      border: '2px solid var(--color-action-sky)', cursor: 'pointer'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          {cat && (
                            <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 700, color: '#3b6fd4', background: '#f0f4ff', borderRadius: '9999px', padding: '2px 8px', marginBottom: '6px' }}>
                              {cat.emoji} {cat.label}
                            </span>
                          )}
                          <h3 style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.01em', marginBottom: '6px' }}>{topic.title}</h3>
                          <p style={{ fontSize: '13px', color: '#72a4f2', fontWeight: 600 }}>🤖 요약 결과 보기</p>
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
  )
}

/* ───────────────────────── 메인 컨테이너 ───────────────────────── */

export default function Student({ user, onLogout }) {
  const [tab, setTab]         = useState('home')
  const [meetings, setMeetings] = useState([])
  const [elections, setElections] = useState([])
  const [todos, setTodos]     = useState([])

  const loadShared = useCallback(async () => {
    try {
      const [mRes, eRes, tdRes] = await Promise.all([
        fetch('/api/meetings'),
        fetch('/api/elections'),
        fetch(`/api/todos?identity=${encodeURIComponent(identityKey(user))}`)
      ])
      setMeetings(await mRes.json())
      setElections(await eRes.json())
      setTodos(await tdRes.json())
    } catch {
      // ignore
    }
  }, [user])

  useEffect(() => { loadShared() }, [loadShared])

  async function toggleAttendance(meetingId) {
    await fetch(`/api/meetings/${meetingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toggleAttendance: { grade: user.grade, class: user.class } })
    })
    await loadShared()
  }

  async function toggleTodo(todoId) {
    await fetch(`/api/todos/${todoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toggleComplete: identityKey(user) })
    })
    await loadShared()
  }

  const tabs = [
    { id: 'home', label: '홈', emoji: '🏠' },
    ...(canSeeMeetings(user) ? [{ id: 'meetings', label: '회의', emoji: '📅' }] : []),
    ...(user.mode === 'class' ? [{ id: 'topics', label: '안건', emoji: '📋' }] : []),
    { id: 'todos', label: '할일', emoji: '✅' }
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-canvas-oat)' }}>
      <Header user={user} onLogout={onLogout} />
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'home' && <HomeTab user={user} meetings={meetings} elections={elections} todos={todos} onToggleTodo={toggleTodo} />}
      {tab === 'meetings' && canSeeMeetings(user) && <MeetingsTab user={user} meetings={meetings} onToggleAttendance={toggleAttendance} />}
      {tab === 'topics' && user.mode === 'class' && <TopicsTab user={user} />}
      {tab === 'todos' && <TodosTab user={user} todos={todos} onToggleTodo={toggleTodo} />}
    </div>
  )
}
