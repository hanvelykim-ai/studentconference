import { useState, useEffect } from 'react'

export default function Home({ onLoginStudent, onLoginTeacher, onDemoStudent, onDemoTeacher }) {
  const [meetings, setMeetings] = useState([])
  const [topics, setTopics] = useState([])
  const [elections, setElections] = useState([])
  const [showDemoModal, setShowDemoModal] = useState(false)

  useEffect(() => {
    fetch('/api/meetings').then(r => r.json()).then(setMeetings).catch(() => {})
    fetch('/api/topics').then(r => r.json()).then(setTopics).catch(() => {})
    fetch('/api/elections').then(r => r.json()).then(setElections).catch(() => {})
  }, [])

  const upcomingMeeting = meetings
    .filter(m => m.status === 'upcoming')
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0]

  const recentTopics = topics
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3)

  const upcomingElection = elections
    .filter(e => e.status === 'upcoming')
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-paper-white)', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 500, color: 'var(--color-ink-black)', marginBottom: 4, letterSpacing: '-0.03em' }}>
            처인초 학생자치회
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-ash-gray)', letterSpacing: '-0.03em' }}>
            Student Council Management
          </p>
        </div>

        {/* Quick Info */}
        {upcomingMeeting && (
          <div className="card" style={{ marginBottom: 16, background: 'var(--color-fog-gray)', border: 'none' }}>
            <div style={{ fontSize: 12, color: 'var(--color-ash-gray)', marginBottom: 4, letterSpacing: '-0.03em' }}>다음 회의</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-ink-black)', letterSpacing: '-0.03em' }}>{upcomingMeeting.title}</div>
            <div style={{ fontSize: 14, color: 'var(--color-ash-gray)', marginTop: 2, letterSpacing: '-0.03em' }}>{upcomingMeeting.date} · {upcomingMeeting.location}</div>
          </div>
        )}

        {recentTopics.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--color-ash-gray)', marginBottom: 8, letterSpacing: '-0.03em' }}>최근 안건</div>
            {recentTopics.map(t => (
              <div key={t.id} style={{ fontSize: 14, color: 'var(--color-ink-black)', padding: '4px 0', borderBottom: '1px solid var(--color-fog-gray)', letterSpacing: '-0.03em' }}>
                <span style={{ fontSize: 11, background: 'var(--color-fog-gray)', padding: '2px 6px', borderRadius: 6, marginRight: 6 }}>{t.category}</span>
                {t.title}
              </div>
            ))}
          </div>
        )}

        {upcomingElection && (
          <div className="card" style={{ marginBottom: 24, borderColor: 'var(--color-highlighter-yellow)', background: '#fffde7' }}>
            <div style={{ fontSize: 12, color: 'var(--color-ash-gray)', marginBottom: 4, letterSpacing: '-0.03em' }}>예정된 선거</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-ink-black)', letterSpacing: '-0.03em' }}>{upcomingElection.title}</div>
            <div style={{ fontSize: 13, color: 'var(--color-ash-gray)', marginTop: 2, letterSpacing: '-0.03em' }}>{upcomingElection.date}</div>
          </div>
        )}

        {/* Login buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          <button className="btn-primary" onClick={onLoginStudent} style={{ width: '100%', padding: '14px', fontSize: 16 }}>
            학생 로그인
          </button>
          <button className="btn-secondary" onClick={onLoginTeacher} style={{ width: '100%', padding: '14px', fontSize: 16 }}>
            선생님 로그인
          </button>
        </div>

        {/* Demo divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--color-fog-gray)' }} />
          <span style={{ fontSize: 13, color: 'var(--color-ash-gray)', letterSpacing: '-0.03em' }}>또는</span>
          <div style={{ flex: 1, height: 1, background: 'var(--color-fog-gray)' }} />
        </div>

        {/* Demo button */}
        <button
          onClick={() => setShowDemoModal(true)}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: 16,
            background: 'transparent',
            border: '1px dashed var(--color-ash-gray)',
            borderRadius: 'var(--radius-buttons)',
            color: 'var(--color-ash-gray)',
            cursor: 'pointer',
            fontFamily: 'var(--font-main)',
            letterSpacing: '-0.03em',
            transition: 'border-color 0.15s, color 0.15s'
          }}
          onMouseEnter={e => { e.target.style.borderColor = 'var(--color-ink-black)'; e.target.style.color = 'var(--color-ink-black)' }}
          onMouseLeave={e => { e.target.style.borderColor = 'var(--color-ash-gray)'; e.target.style.color = 'var(--color-ash-gray)' }}
        >
          🔍 전시용 둘러보기
        </button>
      </div>

      {/* Demo modal */}
      {showDemoModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 16
        }} onClick={() => setShowDemoModal(false)}>
          <div style={{
            background: 'var(--color-paper-white)',
            border: '1px solid var(--color-ink-black)',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 360
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-ink-black)', marginBottom: 8, letterSpacing: '-0.03em' }}>
              전시용 둘러보기
            </div>
            <p style={{ fontSize: 14, color: 'var(--color-ash-gray)', marginBottom: 20, lineHeight: 1.5, letterSpacing: '-0.03em' }}>
              실제 데이터 없이 앱을 체험해볼 수 있습니다. 어떤 역할로 둘러볼까요?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn-primary" onClick={() => { setShowDemoModal(false); onDemoStudent() }} style={{ width: '100%', padding: 14 }}>
                👩‍🎓 학생 체험
                <div style={{ fontSize: 12, fontWeight: 400, marginTop: 2, opacity: 0.7 }}>5학년 1반 회장으로 체험</div>
              </button>
              <button className="btn-secondary" onClick={() => { setShowDemoModal(false); onDemoTeacher() }} style={{ width: '100%', padding: 14 }}>
                👨‍🏫 교사 체험
                <div style={{ fontSize: 12, marginTop: 2, opacity: 0.7 }}>담당 선생님으로 체험</div>
              </button>
              <button onClick={() => setShowDemoModal(false)} style={{
                background: 'none', border: 'none', color: 'var(--color-ash-gray)',
                fontSize: 14, cursor: 'pointer', padding: '8px 0',
                fontFamily: 'var(--font-main)', letterSpacing: '-0.03em'
              }}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
