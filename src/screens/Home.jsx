import { useState, useEffect } from 'react'

function formatDate(d) {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date)) return d
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}

function WidgetCard({ icon, title, children }) {
  return (
    <div className="card" style={{ padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <h3 style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.01em' }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

function EmptyRow({ text }) {
  return <p style={{ color: '#aaa', fontSize: '14px', padding: '4px 0' }}>{text}</p>
}

export default function Home({ onStudentEnter, onTeacherEnter }) {
  const [topics, setTopics]     = useState([])
  const [meetings, setMeetings] = useState([])
  const [elections, setElections] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const [tRes, mRes, eRes] = await Promise.all([
          fetch('/api/topics'),
          fetch('/api/meetings'),
          fetch('/api/elections')
        ])
        setTopics(await tRes.json())
        setMeetings(await mRes.json())
        setElections(await eRes.json())
      } catch {
        // 비로그인 상태 미리보기 실패는 조용히 무시
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const activeTopics = (Array.isArray(topics) ? topics : []).filter(t => t.status === 'active')
  const upcomingMeetings = (Array.isArray(meetings) ? meetings : [])
    .slice().sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 3)
  const upcomingElections = (Array.isArray(elections) ? elections : [])
    .slice().sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 3)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-canvas-oat)', padding: '40px 16px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px', lineHeight: 1 }}>🏫</div>
          <h1 style={{ fontSize: '30px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '6px' }}>
            학생자치회
          </h1>
          <p style={{ color: '#777', fontSize: '15px' }}>우리 학교 학생자치 소식을 한눈에 확인해요</p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <span className="spinner" />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '28px' }}>
            <WidgetCard icon="📅" title="전교 회의 일정">
              {upcomingMeetings.length === 0
                ? <EmptyRow text="예정된 회의가 없어요" />
                : upcomingMeetings.map(m => (
                    <div key={m.id} style={{ padding: '6px 0', borderTop: '1px solid var(--color-border-stone)' }}>
                      <p style={{ fontWeight: 700, fontSize: '14px' }}>{m.title}</p>
                      <p style={{ fontSize: '13px', color: '#999' }}>{formatDate(m.date)} {m.time}</p>
                    </div>
                  ))
              }
            </WidgetCard>

            <WidgetCard icon="📋" title="회의 안건">
              {activeTopics.length === 0
                ? <EmptyRow text="진행 중인 안건이 없어요" />
                : activeTopics.slice(0, 3).map(t => (
                    <div key={t.id} style={{ padding: '6px 0', borderTop: '1px solid var(--color-border-stone)' }}>
                      <p style={{ fontWeight: 700, fontSize: '14px' }}>{t.title}</p>
                    </div>
                  ))
              }
            </WidgetCard>

            <WidgetCard icon="🗳️" title="선거 일정">
              {upcomingElections.length === 0
                ? <EmptyRow text="예정된 선거가 없어요" />
                : upcomingElections.map(e => (
                    <div key={e.id} style={{ padding: '6px 0', borderTop: '1px solid var(--color-border-stone)' }}>
                      <p style={{ fontWeight: 700, fontSize: '14px' }}>{e.title}</p>
                      <p style={{ fontSize: '13px', color: '#999' }}>{formatDate(e.date)}</p>
                    </div>
                  ))
              }
            </WidgetCard>
          </div>
        )}

        {/* Entry */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '28px' }}>
          <button className="btn-primary" onClick={onStudentEnter} style={{ width: '100%', fontSize: '16px', padding: '18px' }}>
            👋 학생 입장
          </button>
          <button className="btn-secondary" onClick={onTeacherEnter} style={{ width: '100%', fontSize: '15px', padding: '14px' }}>
            ⚙️ 관리자 입장
          </button>
        </div>
      </div>
    </div>
  )
}
