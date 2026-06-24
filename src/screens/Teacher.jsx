import { useState, useEffect, useCallback } from 'react'
import { allSlots } from '../lib/identity.js'

/* ───────────────────────── Shared ───────────────────────── */

const SECTIONS = [
  { id: 'topics',   label: '안건',     emoji: '📋' },
  { id: 'meetings',  label: '회의',     emoji: '📅' },
  { id: 'elections', label: '선거',     emoji: '🗳️' },
  { id: 'students',  label: '학생등록', emoji: '🧑‍🎓' },
  { id: 'todos',     label: '할일',     emoji: '✅' }
]

function AdminHeader({ section, setSection, onSettings, onLogout, title, onBack }) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{
        background: 'var(--color-background-paper)',
        borderBottom: '1.5px solid var(--color-border-stone)',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onBack && <button className="btn-ghost" onClick={onBack}>←</button>}
          <span style={{ fontWeight: 700, fontSize: '17px' }}>{title}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn-secondary" onClick={onSettings} style={{ padding: '8px 14px', fontSize: '13px' }}>⚙️ 설정</button>
          <button className="btn-secondary" onClick={onLogout} style={{ padding: '8px 14px', fontSize: '13px' }}>나가기</button>
        </div>
      </div>
      <div style={{
        display: 'flex', gap: '6px', padding: '10px 16px',
        background: 'var(--color-background-paper)',
        borderBottom: '1.5px solid var(--color-border-stone)',
        overflowX: 'auto'
      }}>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            style={{
              padding: '8px 16px', borderRadius: '9999px', border: 'none',
              background: section === s.id ? 'var(--color-action-sky)' : 'transparent',
              color: 'var(--color-text-ink)', fontWeight: 700, fontSize: '14px',
              whiteSpace: 'nowrap', fontFamily: 'var(--font-main)'
            }}
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: 'var(--color-background-paper)', borderRadius: '20px', padding: '18px 20px', border: '1.5px solid var(--color-border-stone)', flex: 1 }}>
      <p style={{ fontSize: '12px', fontWeight: 700, color: '#aaa', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '26px', fontWeight: 900, color: color || 'var(--color-text-ink)', letterSpacing: '-0.02em' }}>{value}</p>
    </div>
  )
}

function formatDate(d) {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date)) return d
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}

/* ───────────────────────── 회의 관리 ───────────────────────── */

function MeetingsSection({ meetings, onCreate, onDelete, ALL_GRADE_CLASSES }) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate]   = useState('')
  const [time, setTime]   = useState('')
  const [location, setLocation] = useState('')
  const [creating, setCreating] = useState(false)
  const [expanded, setExpanded] = useState(null)

  async function submit() {
    if (!title.trim() || !date || creating) return
    setCreating(true)
    try {
      await onCreate({ title, date, time, location })
      setTitle(''); setDate(''); setTime(''); setLocation(''); setShowForm(false)
    } finally {
      setCreating(false)
    }
  }

  // 전체 반 목록 (4-6학년만 참여 체크 대상)
  const allClasses = []
  for (const g of [4, 5, 6]) {
    for (const c of ALL_GRADE_CLASSES[g] || []) allClasses.push({ grade: g, class: c })
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em' }}>전교 회의 일정</h2>
        <button className="btn-primary" onClick={() => setShowForm(v => !v)} style={{ padding: '12px 22px' }}>
          {showForm ? '취소' : '+ 새 회의 등록'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input className="input" placeholder="회의 제목 (예: 4월 전교 학생자치회의)" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          <div style={{ display: 'flex', gap: '10px' }}>
            <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ flex: 1 }} />
            <input className="input" type="time" value={time} onChange={e => setTime(e.target.value)} style={{ flex: 1 }} />
          </div>
          <input className="input" placeholder="장소 (선택)" value={location} onChange={e => setLocation(e.target.value)} />
          <button className="btn-primary" onClick={submit} disabled={!title.trim() || !date || creating} style={{ width: '100%' }}>
            {creating ? <span className="spinner" /> : '등록하기'}
          </button>
        </div>
      )}

      {meetings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ color: '#888' }}>등록된 회의가 없어요</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {meetings.map(m => {
            const attended = m.attendance || []
            const isExpanded = expanded === m.id
            return (
              <div key={m.id} className="card" style={{ padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '16px' }}>{m.title}</p>
                    <p style={{ color: '#999', fontSize: '14px', marginTop: '4px' }}>
                      {formatDate(m.date)} {m.time} {m.location && `· ${m.location}`}
                    </p>
                  </div>
                  <span className="badge badge-sky">{attended.length}/{allClasses.length}반 참여</span>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                  <button className="btn-secondary" onClick={() => setExpanded(isExpanded ? null : m.id)} style={{ flex: 1, padding: '8px 14px', fontSize: '13px' }}>
                    {isExpanded ? '참여 현황 닫기' : '참여 현황 보기'}
                  </button>
                  <button
                    onClick={() => onDelete(m.id)}
                    style={{ padding: '8px 14px', borderRadius: '9999px', border: '1.5px solid #fca5a5', background: 'white', color: '#ef4444', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-main)', fontWeight: 600 }}
                  >
                    삭제
                  </button>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--color-border-stone)', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {allClasses.map(({ grade, class: cls }) => {
                      const checked = attended.some(a => a.grade === grade && a.class === cls)
                      return (
                        <span key={`${grade}-${cls}`} className={`badge ${checked ? 'badge-green' : 'badge-gray'}`}>
                          {checked ? '✓ ' : ''}{grade}학년 {cls}반
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ───────────────────────── 선거 관리 ───────────────────────── */

function ElectionsSection({ elections, onCreate, onDelete }) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate]   = useState('')
  const [desc, setDesc]   = useState('')
  const [creating, setCreating] = useState(false)

  async function submit() {
    if (!title.trim() || !date || creating) return
    setCreating(true)
    try {
      await onCreate({ title, date, description: desc })
      setTitle(''); setDate(''); setDesc(''); setShowForm(false)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em' }}>선거 일정</h2>
        <button className="btn-primary" onClick={() => setShowForm(v => !v)} style={{ padding: '12px 22px' }}>
          {showForm ? '취소' : '+ 새 선거 등록'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input className="input" placeholder="선거 제목 (예: 2학기 전교 회장단 선거)" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <textarea className="textarea" placeholder="설명 (선택)" value={desc} onChange={e => setDesc(e.target.value)} style={{ minHeight: '80px' }} />
          <button className="btn-primary" onClick={submit} disabled={!title.trim() || !date || creating} style={{ width: '100%' }}>
            {creating ? <span className="spinner" /> : '등록하기'}
          </button>
        </div>
      )}

      {elections.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ color: '#888' }}>등록된 선거 일정이 없어요</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {elections.map(e => (
            <div key={e.id} className="card" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '16px' }}>{e.title}</p>
                  <p style={{ color: '#999', fontSize: '14px', marginTop: '4px' }}>{formatDate(e.date)}</p>
                  {e.description && <p style={{ color: '#777', fontSize: '14px', marginTop: '8px' }}>{e.description}</p>}
                </div>
                <button
                  onClick={() => onDelete(e.id)}
                  style={{ padding: '8px 14px', borderRadius: '9999px', border: '1.5px solid #fca5a5', background: 'white', color: '#ef4444', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-main)', fontWeight: 600, flexShrink: 0 }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ───────────────────────── 학생 등록 (비공개) ───────────────────────── */

function StudentsSection({ students, onSave }) {
  const slots = allSlots()
  const [drafts, setDrafts] = useState({})
  const [savedFlash, setSavedFlash] = useState(null)

  function nameFor(key) {
    if (key in drafts) return drafts[key]
    return students.find(s => s.slotKey === key)?.name || ''
  }

  async function handleBlur(key) {
    if (!(key in drafts)) return
    await onSave(key, drafts[key])
    setSavedFlash(key)
    setTimeout(() => setSavedFlash(null), 1200)
  }

  // 학년반별 그룹
  const classSlots = slots.filter(s => s.key.startsWith('c-'))
  const schoolSlots = slots.filter(s => s.key.startsWith('s-'))
  const grouped = {}
  classSlots.forEach(s => {
    const k = `${s.grade}-${s.class}`
    grouped[k] = grouped[k] || []
    grouped[k].push(s)
  })

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '6px' }}>학생 등록</h2>
        <p style={{ color: '#888', fontSize: '14px' }}>직위에 실제 학생 이름을 매칭해두세요. 이 정보는 관리자만 볼 수 있어요.</p>
      </div>

      <div className="alert alert-info">🔒 여기서 등록한 이름은 학생 화면에는 절대 표시되지 않습니다.</div>

      <div className="card">
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>전교 임원</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {schoolSlots.map(s => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ minWidth: '140px', fontSize: '14px', fontWeight: 600, color: '#555' }}>{s.label}</span>
              <input
                className="input"
                placeholder="이름 입력"
                value={nameFor(s.key)}
                onChange={e => setDrafts(d => ({ ...d, [s.key]: e.target.value }))}
                onBlur={() => handleBlur(s.key)}
                style={{ flex: 1, padding: '10px 16px' }}
              />
              {savedFlash === s.key && <span style={{ color: '#15803d', fontSize: '12px', fontWeight: 700 }}>✓ 저장됨</span>}
            </div>
          ))}
        </div>
      </div>

      {Object.entries(grouped).map(([clsKey, items]) => (
        <div key={clsKey} className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>{items[0].grade}학년 {items[0].class}반</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {items.map(s => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ minWidth: '90px', fontSize: '14px', fontWeight: 600, color: '#555' }}>{s.label.split(' ').pop()}</span>
                <input
                  className="input"
                  placeholder="이름 입력"
                  value={nameFor(s.key)}
                  onChange={e => setDrafts(d => ({ ...d, [s.key]: e.target.value }))}
                  onBlur={() => handleBlur(s.key)}
                  style={{ flex: 1, padding: '10px 16px' }}
                />
                {savedFlash === s.key && <span style={{ color: '#15803d', fontSize: '12px', fontWeight: 700 }}>✓ 저장됨</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ───────────────────────── 할 일 관리 ───────────────────────── */

function TodosSection({ todos, onCreate, onDelete }) {
  const slots = allSlots()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc]   = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assigned, setAssigned] = useState([])
  const [creating, setCreating] = useState(false)

  function toggleAssign(key) {
    setAssigned(a => a.includes(key) ? a.filter(k => k !== key) : [...a, key])
  }

  async function submit() {
    if (!title.trim() || assigned.length === 0 || creating) return
    setCreating(true)
    try {
      await onCreate({ title, description: desc, dueDate, assignedTo: assigned })
      setTitle(''); setDesc(''); setDueDate(''); setAssigned([]); setShowForm(false)
    } finally {
      setCreating(false)
    }
  }

  function labelFor(key) {
    return slots.find(s => s.key === key)?.label || key
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em' }}>할 일 관리</h2>
        <button className="btn-primary" onClick={() => setShowForm(v => !v)} style={{ padding: '12px 22px' }}>
          {showForm ? '취소' : '+ 새 할 일 등록'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input className="input" placeholder="할 일 제목" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          <textarea className="textarea" placeholder="설명 (선택)" value={desc} onChange={e => setDesc(e.target.value)} style={{ minHeight: '70px' }} />
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#888' }}>기한 (선택)</label>
            <input className="input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#888' }}>받을 학생 선택 ({assigned.length}명)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '220px', overflowY: 'auto', padding: '4px' }}>
              {slots.map(s => (
                <button
                  key={s.key}
                  onClick={() => toggleAssign(s.key)}
                  style={{
                    padding: '6px 12px', borderRadius: '9999px',
                    border: assigned.includes(s.key) ? '2px solid var(--color-outline-ebony)' : '1.5px solid var(--color-border-stone)',
                    background: assigned.includes(s.key) ? 'var(--color-action-sky)' : 'var(--color-background-paper)',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-main)'
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-primary" onClick={submit} disabled={!title.trim() || assigned.length === 0 || creating} style={{ width: '100%' }}>
            {creating ? <span className="spinner" /> : '등록하기'}
          </button>
        </div>
      )}

      {todos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ color: '#888' }}>등록된 할 일이 없어요</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {todos.map(t => {
            const doneCount = (t.completedBy || []).length
            const totalCount = (t.assignedTo || []).length
            return (
              <div key={t.id} className="card" style={{ padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: '16px' }}>{t.title}</p>
                    {t.description && <p style={{ color: '#777', fontSize: '14px', marginTop: '4px' }}>{t.description}</p>}
                    {t.dueDate && <p style={{ color: '#aaa', fontSize: '13px', marginTop: '4px' }}>기한: {formatDate(t.dueDate)}</p>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                      {(t.assignedTo || []).map(key => (
                        <span key={key} className={`badge ${(t.completedBy || []).includes(key) ? 'badge-green' : 'badge-gray'}`}>
                          {(t.completedBy || []).includes(key) ? '✓ ' : ''}{labelFor(key)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                    <span className="badge badge-sky">{doneCount}/{totalCount} 완료</span>
                    <button
                      onClick={() => onDelete(t.id)}
                      style={{ padding: '6px 12px', borderRadius: '9999px', border: '1.5px solid #fca5a5', background: 'white', color: '#ef4444', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-main)', fontWeight: 600 }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ───────────────────────── 메인 컴포넌트 ───────────────────────── */

export default function Teacher({ onLogout }) {
  const [section, setSection] = useState('topics')
  const [view, setView]           = useState('dashboard')
  const [topics, setTopics]       = useState([])
  const [submissions, setSubs]    = useState([])
  const [summaries, setSummaries] = useState({})
  const [selected, setSelected]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const [summarizing, setSummarizing] = useState(false)
  const [summaryError, setSummaryError] = useState('')

  const [meetings, setMeetings]   = useState([])
  const [elections, setElections] = useState([])
  const [students, setStudents]   = useState([])
  const [todos, setTodos]         = useState([])

  // Create topic
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc]   = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [creating, setCreating] = useState(false)
  const [categoryWarning, setCategoryWarning] = useState('')

  const CATEGORIES = [
    { id: '협의사항', label: '협의사항', emoji: '🤝', desc: '학생들이 함께 지킬 내용', hint: '예: 청소 구역 재배정, 급식 줄서기 규칙' },
    { id: '건의사항', label: '건의사항', emoji: '📣', desc: '학교에서 해결해줄 내용', hint: '예: 화장실 비품 보충, 냉난방 요청' },
    { id: '이달의안건', label: '이 달의 안건', emoji: '📅', desc: '이번 달 주요 안건', hint: '예: 수련회 장소 의견, 학예회 종목 선정' }
  ]

  function checkCategoryMismatch(title, desc, category) {
    if (!category || (!title && !desc)) return ''
    const text = (title + ' ' + desc).toLowerCase()
    const 건의keywords = ['해주세요', '해달라', '해줬으면', '요청', '설치해', '지원해', '제공해', '부탁', '개선해', '고쳐', '바꿔']
    const 협의keywords = ['우리가', '함께', '지키자', '약속', '규칙', '정하자', '스스로', '자체적']
    const has건의 = 건의keywords.some(k => text.includes(k))
    const has협의 = 협의keywords.some(k => text.includes(k))
    if (category === '협의사항' && has건의) return '⚠️ 내용이 건의사항처럼 보여요. 협의사항은 학생들이 스스로 지킬 내용을 담아야 해요. 카테고리를 확인해 주세요.'
    if (category === '건의사항' && has협의) return '⚠️ 내용이 협의사항처럼 보여요. 건의사항은 학교 측에 요청할 내용을 담아야 해요. 카테고리를 확인해 주세요.'
    return ''
  }

  function handleTitleChange(val) { setNewTitle(val); setCategoryWarning(checkCategoryMismatch(val, newDesc, newCategory)) }
  function handleDescChange(val) { setNewDesc(val); setCategoryWarning(checkCategoryMismatch(newTitle, val, newCategory)) }
  function handleCategoryChange(cat) { setNewCategory(cat); setCategoryWarning(checkCategoryMismatch(newTitle, newDesc, cat)) }

  // Settings
  const [claudeKey, setClaudeKey]   = useState('')
  const [geminiKey, setGeminiKey]   = useState('')
  const [newPin, setNewPin]         = useState('')
  const [aiProvider, setAiProvider] = useState('claude')
  const [hasClaudeKey, setHasClaudeKey] = useState(false)
  const [hasGeminiKey, setHasGeminiKey] = useState(false)
  const [settingMsg, setSettingMsg] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  // 학년/반 목록 (회의 참여현황 계산용 - 등록 화면과 동일 구조)
  const ALL_GRADE_CLASSES = { 2: [1, 2, 3, 4], 3: [1, 2], 4: [1, 2], 5: [1, 2], 6: [1] }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [tRes, sRes, cfgRes, mRes, eRes, stRes, tdRes] = await Promise.all([
        fetch('/api/topics'),
        fetch('/api/submissions'),
        fetch('/api/settings'),
        fetch('/api/meetings'),
        fetch('/api/elections'),
        fetch('/api/students'),
        fetch('/api/todos')
      ])
      const tData  = await tRes.json()
      const sData  = await sRes.json()
      const cfgData = await cfgRes.json()

      setTopics(Array.isArray(tData) ? tData : [])
      setSubs(Array.isArray(sData) ? sData : [])
      setHasClaudeKey(cfgData.hasClaudeKey)
      setHasGeminiKey(cfgData.hasGeminiKey)
      setAiProvider(cfgData.aiProvider || 'claude')
      setMeetings(await mRes.json())
      setElections(await eRes.json())
      setStudents(await stRes.json())
      setTodos(await tdRes.json())

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

  function getTopicSubs(topicId) { return submissions.filter(s => s.topicId === topicId) }

  async function createTopic() {
    if (!newTitle.trim() || !newCategory || creating) return
    setCreating(true)
    try {
      await fetch('/api/topics', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim(), category: newCategory })
      })
      setNewTitle(''); setNewDesc(''); setNewCategory(''); setCategoryWarning('')
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: topic.id })
      })
      const data = await res.json()
      if (data.error) setSummaryError(data.error)
      else await loadData()
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
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setClaudeKey(''); setGeminiKey(''); setNewPin('')
    await loadData()
    setSettingMsg('설정이 저장되었습니다.')
    setTimeout(() => setSettingMsg(''), 3000)
  }

  // ── 회의 / 선거 / 학생등록 / 할일: API 연동 ──
  async function createMeeting(payload) {
    await fetch('/api/meetings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    await loadData()
  }
  async function deleteMeeting(id) {
    await fetch(`/api/meetings/${id}`, { method: 'DELETE' })
    await loadData()
  }
  async function createElection(payload) {
    await fetch('/api/elections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    await loadData()
  }
  async function deleteElection(id) {
    await fetch(`/api/elections/${id}`, { method: 'DELETE' })
    await loadData()
  }
  async function saveStudentName(slotKey, name) {
    await fetch('/api/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slotKey, name }) })
    await loadData()
  }
  async function createTodo(payload) {
    await fetch('/api/todos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    await loadData()
  }
  async function deleteTodo(id) {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' })
    await loadData()
  }

  const goSettings = () => setView('settings')

  // ── 설정 화면 (모든 섹션에서 접근 가능) ──
  if (view === 'settings') {
    const activeKeyOk = aiProvider === 'claude' ? hasClaudeKey : hasGeminiKey
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-canvas-oat)' }}>
        <AdminHeader section={section} setSection={s => { setSection(s); setView('dashboard') }} onSettings={goSettings} onLogout={onLogout} title="설정" onBack={() => setView('dashboard')} />
        <div style={{ maxWidth: '520px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div className="card">
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>AI 제공사 선택</h3>
            <p style={{ color: '#777', fontSize: '14px', marginBottom: '14px' }}>요약에 사용할 AI를 선택하세요. 선택한 제공사의 API 키가 설정되어 있어야 합니다.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { id: 'claude', label: 'Claude', sub: 'Anthropic', hasKey: hasClaudeKey, color: '#7c3aed' },
                { id: 'gemini', label: 'Gemini', sub: 'Google',    hasKey: hasGeminiKey, color: '#1d4ed8' }
              ].map(opt => (
                <button key={opt.id} onClick={() => setAiProvider(opt.id)} style={{
                  flex: 1, padding: '16px', borderRadius: '20px',
                  border: aiProvider === opt.id ? `2px solid ${opt.color}` : '2px solid var(--color-border-stone)',
                  background: aiProvider === opt.id ? `${opt.color}12` : 'var(--color-background-paper)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'var(--font-main)'
                }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-ink)', marginBottom: '4px' }}>{aiProvider === opt.id ? '✓ ' : ''}{opt.label}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{opt.sub}</div>
                  <div style={{ fontSize: '12px', marginTop: '6px', color: opt.hasKey ? '#15803d' : '#aaa', fontWeight: 600 }}>{opt.hasKey ? '키 설정됨' : '키 없음'}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Claude API 키</h3>
              {hasClaudeKey ? <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 700 }}>✓ 설정됨</span> : <span style={{ fontSize: '12px', color: '#aaa' }}>미설정</span>}
            </div>
            <p style={{ color: '#777', fontSize: '13px', marginBottom: '12px' }}>Anthropic Console에서 발급 · sk-ant-...</p>
            <input className="input" type="password" placeholder={hasClaudeKey ? '새 키를 입력하면 교체됩니다' : 'sk-ant-...'} value={claudeKey} onChange={e => setClaudeKey(e.target.value)} />
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Gemini API 키</h3>
              {hasGeminiKey ? <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 700 }}>✓ 설정됨</span> : <span style={{ fontSize: '12px', color: '#aaa' }}>미설정</span>}
            </div>
            <p style={{ color: '#777', fontSize: '13px', marginBottom: '12px' }}>Google AI Studio에서 발급 · AIza...</p>
            <input className="input" type="password" placeholder={hasGeminiKey ? '새 키를 입력하면 교체됩니다' : 'AIza...'} value={geminiKey} onChange={e => setGeminiKey(e.target.value)} />
          </div>

          <div className="card">
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>교사 PIN 변경</h3>
            <p style={{ color: '#777', fontSize: '13px', marginBottom: '12px' }}>교사 모드 진입 PIN을 변경합니다</p>
            <input className="input" type="password" placeholder="새 PIN 번호" value={newPin} onChange={e => setNewPin(e.target.value)} />
          </div>

          {!activeKeyOk && <div className="alert alert-warning">현재 선택된 AI({aiProvider === 'claude' ? 'Claude' : 'Gemini'})의 API 키가 설정되지 않았습니다.</div>}
          {settingMsg && <div className="alert alert-success">{settingMsg}</div>}

          <button className="btn-primary" onClick={saveSettings} style={{ width: '100%', fontSize: '16px', padding: '18px' }}>저장하기</button>
        </div>
      </div>
    )
  }

  // ── 회의 / 선거 / 학생등록 / 할일 섹션 ──
  if (section === 'meetings') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-canvas-oat)' }}>
        <AdminHeader section={section} setSection={setSection} onSettings={goSettings} onLogout={onLogout} title="관리자" />
        <MeetingsSection meetings={meetings} onCreate={createMeeting} onDelete={deleteMeeting} ALL_GRADE_CLASSES={ALL_GRADE_CLASSES} />
      </div>
    )
  }
  if (section === 'elections') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-canvas-oat)' }}>
        <AdminHeader section={section} setSection={setSection} onSettings={goSettings} onLogout={onLogout} title="관리자" />
        <ElectionsSection elections={elections} onCreate={createElection} onDelete={deleteElection} />
      </div>
    )
  }
  if (section === 'students') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-canvas-oat)' }}>
        <AdminHeader section={section} setSection={setSection} onSettings={goSettings} onLogout={onLogout} title="관리자" />
        <StudentsSection students={students} onSave={saveStudentName} />
      </div>
    )
  }
  if (section === 'todos') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-canvas-oat)' }}>
        <AdminHeader section={section} setSection={setSection} onSettings={goSettings} onLogout={onLogout} title="관리자" />
        <TodosSection todos={todos} onCreate={createTodo} onDelete={deleteTodo} />
      </div>
    )
  }

  // ── 안건(topics) 섹션: 새 안건 등록 ──
  if (view === 'create') {
    const selectedCat = CATEGORIES.find(c => c.id === newCategory)
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-canvas-oat)' }}>
        <AdminHeader section={section} setSection={setSection} onSettings={goSettings} onLogout={onLogout} title="새 안건 등록" onBack={() => { setView('dashboard'); setCategoryWarning('') }} />
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div className="card">
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
              안건 종류 <span style={{ color: 'var(--color-icon-ember)' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => handleCategoryChange(cat.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 18px', borderRadius: '20px',
                  border: newCategory === cat.id ? '2px solid var(--color-action-sky)' : '1.5px solid var(--color-border-stone)',
                  background: newCategory === cat.id ? 'rgba(100,170,255,0.08)' : 'var(--color-background-paper)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'var(--font-main)'
                }}>
                  <span style={{ fontSize: '24px', flexShrink: 0 }}>{cat.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-ink)' }}>{newCategory === cat.id ? '✓ ' : ''}{cat.label}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#888', marginTop: '3px' }}>{cat.desc}</p>
                    <p style={{ fontSize: '12px', color: '#bbb', marginTop: '2px' }}>{cat.hint}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>안건 제목 <span style={{ color: 'var(--color-icon-ember)' }}>*</span></label>
              <input className="input" placeholder={selectedCat ? selectedCat.hint.split('예: ')[1]?.split(',')[0] || '안건 제목을 입력하세요' : '안건 제목을 입력하세요'} value={newTitle} onChange={e => handleTitleChange(e.target.value)} onKeyDown={e => e.key === 'Enter' && createTopic()} autoFocus />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>안건 설명 <span style={{ color: '#bbb', fontWeight: 400 }}>(선택)</span></label>
              <textarea className="textarea" placeholder="안건에 대한 추가 설명을 입력해주세요" value={newDesc} onChange={e => handleDescChange(e.target.value)} style={{ minHeight: '90px' }} />
            </div>
          </div>

          {categoryWarning && <div className="alert alert-warning">{categoryWarning}</div>}

          <button className="btn-primary" onClick={createTopic} disabled={!newTitle.trim() || !newCategory || creating} style={{ fontSize: '16px', padding: '18px' }}>
            {creating ? <><span className="spinner" /> 등록 중...</> : '안건 등록하기'}
          </button>
        </div>
      </div>
    )
  }

  // ── 안건 상세 ──
  if (view === 'detail' && selected) {
    const currentTopic = topics.find(t => t.id === selected.id) || selected
    const topicSubs    = getTopicSubs(currentTopic.id)
    const summary      = summaries[currentTopic.id]
    const isCompleted  = currentTopic.status === 'completed'

    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-canvas-oat)' }}>
        <AdminHeader section={section} setSection={setSection} onSettings={goSettings} onLogout={onLogout} title={currentTopic.title} onBack={() => { setView('dashboard'); setSummaryError('') }} />
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div className="card">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '14px' }}>
              <span className={`badge ${isCompleted ? 'badge-green' : 'badge-blue'}`}>{isCompleted ? '✓ 요약 완료' : '진행 중'}</span>
              <span className="badge badge-gray">{topicSubs.length}개 반 제출</span>
            </div>

            {currentTopic.description && <p style={{ color: '#666', fontSize: '15px', lineHeight: 1.6, marginBottom: '16px' }}>{currentTopic.description}</p>}

            {!(aiProvider === 'claude' ? hasClaudeKey : hasGeminiKey) && (
              <div className="alert alert-warning" style={{ marginBottom: '14px' }}>
                ⚠️ {aiProvider === 'claude' ? 'Claude' : 'Gemini'} API 키가 없습니다.{' '}
                <button onClick={goSettings} style={{ background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'var(--font-main)', color: '#854d0e' }}>설정에서 입력</button>
                해주세요.
              </div>
            )}

            {summaryError && <div className="alert alert-error" style={{ marginBottom: '14px' }}>{summaryError}</div>}

            <button className="btn-primary" onClick={() => summarize(currentTopic)} disabled={summarizing || topicSubs.length === 0 || !(aiProvider === 'claude' ? hasClaudeKey : hasGeminiKey)} style={{ width: '100%', fontSize: '16px', padding: '18px' }}>
              {summarizing ? <><span className="spinner" /> AI가 요약 중입니다...</> : isCompleted ? '🔄 AI로 다시 요약하기' : '🤖 AI로 의견 요약하기'}
            </button>
          </div>

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
              <div style={{ background: 'var(--color-canvas-oat)', borderRadius: '20px', padding: '20px 22px' }}>
                <p className="summary-text">{summary.summary}</p>
              </div>
            </div>
          )}

          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '12px' }}>각 반 제출 현황</h3>
            {topicSubs.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px' }}><p style={{ color: '#888' }}>아직 제출된 의견이 없습니다</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topicSubs.sort((a, b) => a.grade - b.grade || a.class - b.class).map(sub => (
                  <div key={sub.id} className="card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <span className="badge badge-sky">{sub.grade}학년 {sub.class}반</span>
                      <span style={{ fontSize: '12px', color: '#bbb' }}>{new Date(sub.updatedAt || sub.submittedAt).toLocaleString('ko-KR')}{sub.updatedAt ? ' (수정됨)' : ''}</span>
                    </div>
                    <p style={{ fontSize: '15px', lineHeight: 1.75, whiteSpace: 'pre-wrap', color: 'var(--color-text-ink)' }}>{sub.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderTop: '1.5px solid var(--color-border-stone)', paddingTop: '16px' }}>
            <button onClick={() => setConfirmDelete(currentTopic)} style={{ background: 'none', border: '1.5px solid #fca5a5', borderRadius: '9999px', padding: '10px 20px', color: '#ef4444', fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-main)', fontWeight: 600 }}>
              이 안건 삭제
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── 안건 대시보드 (기본 화면) ──
  const activeTopics = topics.filter(t => t.status === 'active')
  const doneTopics   = topics.filter(t => t.status === 'completed')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-canvas-oat)' }}>
      <AdminHeader section={section} setSection={setSection} onSettings={goSettings} onLogout={onLogout} title="관리자" />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {!loading && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <StatCard label="전체 안건" value={topics.length} />
            <StatCard label="진행 중" value={activeTopics.length} color="var(--color-action-sky)" />
            <StatCard label="요약 완료" value={doneTopics.length} color="#15803d" />
            <StatCard label="총 제출" value={submissions.length} />
          </div>
        )}

        {!loading && !(aiProvider === 'claude' ? hasClaudeKey : hasGeminiKey) && (
          <div className="alert alert-warning" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠️ {aiProvider === 'claude' ? 'Claude' : 'Gemini'} API 키를 설정해야 요약이 가능합니다</span>
            <button onClick={goSettings} style={{ background: 'none', border: '1.5px solid #92400e', borderRadius: '9999px', padding: '4px 12px', color: '#92400e', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-main)' }}>설정하기</button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em' }}>안건 목록</h2>
          <button className="btn-primary" onClick={() => setView('create')} style={{ padding: '12px 22px' }}>+ 새 안건</button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><span className="spinner" /></div>
        ) : topics.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '56px 32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <p style={{ fontWeight: 700, marginBottom: '6px' }}>등록된 안건이 없어요</p>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>새 안건을 등록하면 학생들이 의견을 입력할 수 있어요</p>
            <button className="btn-primary" onClick={() => setView('create')}>+ 첫 안건 등록하기</button>
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
                        {topic.category && (() => {
                          const cat = CATEGORIES.find(c => c.id === topic.category)
                          return cat ? (
                            <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '9999px', background: '#f0f4ff', color: '#3b6fd4' }}>{cat.emoji} {cat.label}</span>
                          ) : null
                        })()}
                        <h3 style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.01em' }}>{topic.title}</h3>
                        {isCompleted && <span className="badge badge-green">완료</span>}
                        {hasSummary && !isCompleted && <span className="badge badge-blue">요약있음</span>}
                      </div>
                      {topic.description && (
                        <p style={{ color: '#777', fontSize: '14px', lineHeight: 1.5, marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{topic.description}</p>
                      )}
                      <p style={{ fontSize: '13px', color: '#aaa' }}>{subs.length}개 반 제출{hasSummary && ' · AI 요약 완료'}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button className="btn-secondary" onClick={() => { setSelected(topic); setView('detail'); setSummaryError('') }} style={{ flex: 1, padding: '10px 16px' }}>자세히 보기</button>
                    <button onClick={() => setConfirmDelete(topic)} style={{ padding: '10px 16px', borderRadius: '9999px', border: '1.5px solid #fca5a5', background: 'white', color: '#ef4444', fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-main)', fontWeight: 600 }}>삭제</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {confirmDelete && (
        <div onClick={() => setConfirmDelete(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', zIndex: 100 }}>
          <div className="card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '380px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>안건 삭제</h3>
            <p style={{ color: '#555', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
              "<strong>{confirmDelete.title}</strong>" 안건과 모든 제출 내용, 요약이 삭제됩니다.<br />이 작업은 되돌릴 수 없습니다.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setConfirmDelete(null)} style={{ flex: 1 }}>취소</button>
              <button onClick={() => deleteTopic(confirmDelete.id)} style={{ flex: 2, padding: '14px', borderRadius: '9999px', border: 'none', background: '#ef4444', color: 'white', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-main)' }}>삭제하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
