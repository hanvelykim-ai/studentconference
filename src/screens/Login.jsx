import { useState } from 'react'

// 학년별 반 목록
const GRADE_CLASSES = {
  2: [1, 2, 3, 4],
  3: [1, 2],
  4: [1, 2],
  5: [1, 2],
  6: [1]
}
const GRADES = Object.keys(GRADE_CLASSES).map(Number)

export default function Login({ onLogin }) {
  const [grade, setGrade] = useState(null)
  const [cls, setCls]     = useState(null)
  const [showTeacher, setShowTeacher] = useState(false)
  const [pin, setPin]     = useState('')
  const [pinError, setPinError] = useState('')
  const [loading, setLoading]   = useState(false)

  function selectGrade(g) {
    setGrade(g)
    const classes = GRADE_CLASSES[g]
    // 반이 1개뿐이면 자동 선택
    setCls(classes.length === 1 ? classes[0] : null)
  }

  async function handleTeacherLogin() {
    if (!pin.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      })
      const data = await res.json()
      if (data.valid) {
        onLogin({ type: 'teacher' })
      } else {
        setPinError('PIN 번호가 올바르지 않습니다.')
      }
    } catch {
      setPinError('서버에 연결할 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  function closeTeacher() {
    setShowTeacher(false)
    setPin('')
    setPinError('')
  }

  const currentClasses = grade ? GRADE_CLASSES[grade] : []
  const singleClass    = currentClasses.length === 1

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-canvas-oat)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px'
    }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '52px', marginBottom: '12px', lineHeight: 1 }}>🏫</div>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '900',
          color: 'var(--color-text-ink)',
          letterSpacing: '-0.02em',
          marginBottom: '8px'
        }}>
          학생자치 회의
        </h1>
        <p style={{ color: '#777', fontSize: '15px', fontWeight: 400 }}>
          우리 반 의견을 모아요
        </p>
      </div>

      {/* Card */}
      <div className="card" style={{ width: '100%', maxWidth: '460px' }}>

        {/* Grade */}
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#888', letterSpacing: '0.06em', marginBottom: '10px', textTransform: 'uppercase' }}>
          학년 선택
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '28px' }}>
          {GRADES.map(g => (
            <button
              key={g}
              onClick={() => selectGrade(g)}
              style={{
                flex: '1 1 auto',
                minWidth: '72px',
                padding: '14px 0',
                borderRadius: '9999px',
                border: grade === g ? '2px solid var(--color-outline-ebony)' : '2px solid transparent',
                background: grade === g ? 'var(--color-action-sky)' : 'var(--color-canvas-oat)',
                color: 'var(--color-text-ink)',
                fontSize: '16px',
                fontWeight: 700,
                transition: 'all 0.15s'
              }}
            >
              {g}학년
            </button>
          ))}
        </div>

        {/* Class — 반이 1개이면 "자동 선택됨" 안내, 여러 개면 버튼 표시 */}
        <div style={{
          overflow: 'hidden',
          maxHeight: grade ? '180px' : '0',
          opacity: grade ? 1 : 0,
          transition: 'max-height 0.25s ease, opacity 0.2s'
        }}>
          {singleClass ? (
            <div className="alert alert-info" style={{ marginBottom: '28px' }}>
              {grade}학년은 1반 하나입니다. 자동으로 선택되었어요.
            </div>
          ) : (
            <>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#888', letterSpacing: '0.06em', marginBottom: '10px', textTransform: 'uppercase' }}>
                반 선택
              </p>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '28px'
              }}>
                {currentClasses.map(c => (
                  <button
                    key={c}
                    onClick={() => setCls(c)}
                    style={{
                      flex: '1 1 auto',
                      minWidth: '72px',
                      padding: '14px 0',
                      borderRadius: '9999px',
                      border: cls === c ? '2px solid var(--color-outline-ebony)' : '2px solid transparent',
                      background: cls === c ? 'var(--color-action-sky)' : 'var(--color-canvas-oat)',
                      color: 'var(--color-text-ink)',
                      fontSize: '15px',
                      fontWeight: 700,
                      transition: 'all 0.15s'
                    }}
                  >
                    {c}반
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          className="btn-primary"
          onClick={() => onLogin({ type: 'student', grade, class: cls })}
          disabled={!grade || !cls}
          style={{ width: '100%', fontSize: '16px', padding: '18px' }}
        >
          {grade && cls ? `${grade}학년 ${cls}반으로 입장` : '학년을 선택해주세요'}
        </button>
      </div>

      {/* Teacher link */}
      <button
        onClick={() => setShowTeacher(true)}
        style={{
          marginTop: '28px',
          background: 'none',
          border: 'none',
          color: '#999',
          fontSize: '13px',
          cursor: 'pointer',
          textDecoration: 'underline',
          fontFamily: 'var(--font-main)'
        }}
      >
        교사 모드로 입장
      </button>

      {/* Teacher Modal */}
      {showTeacher && (
        <div
          onClick={closeTeacher}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px', zIndex: 100
          }}
        >
          <div
            className="card"
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '360px' }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>교사 모드</h2>
            <p style={{ color: '#777', fontSize: '14px', marginBottom: '20px' }}>
              PIN 번호를 입력해주세요
              <br />
              <span style={{ fontSize: '12px', color: '#bbb' }}>초기 PIN: 1234</span>
            </p>
            <input
              className="input"
              type="password"
              placeholder="PIN 번호"
              value={pin}
              onChange={e => { setPin(e.target.value); setPinError('') }}
              onKeyDown={e => e.key === 'Enter' && handleTeacherLogin()}
              style={{ marginBottom: pinError ? '8px' : '20px' }}
              autoFocus
            />
            {pinError && (
              <p className="alert alert-error" style={{ marginBottom: '16px' }}>{pinError}</p>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-secondary" onClick={closeTeacher} style={{ flex: 1 }}>
                취소
              </button>
              <button
                className="btn-primary"
                onClick={handleTeacherLogin}
                disabled={loading || !pin.trim()}
                style={{ flex: 2 }}
              >
                {loading ? <span className="spinner" /> : '입장하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
