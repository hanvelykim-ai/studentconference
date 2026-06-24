import { useState } from 'react'
import { GRADE_CLASSES, GRADES, CLASS_POSITIONS, SCHOOL_POSITIONS, SCHOOL_DEPUTY_GRADES } from '../lib/identity.js'

function PillRow({ options, value, onSelect, render }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '28px' }}>
      {options.map(opt => (
        <button
          key={String(opt)}
          onClick={() => onSelect(opt)}
          style={{
            flex: '1 1 auto',
            minWidth: '72px',
            padding: '14px 0',
            borderRadius: '10px',
            border: value === opt ? '2px solid var(--color-outline-ebony)' : '2px solid transparent',
            background: value === opt ? 'var(--color-action-sky)' : 'var(--color-canvas-oat)',
            color: 'var(--color-text-ink)',
            fontSize: '15px',
            fontWeight: 700,
            transition: 'all 0.15s'
          }}
        >
          {render ? render(opt) : opt}
        </button>
      ))}
    </div>
  )
}

function Label({ children }) {
  return (
    <p style={{ fontSize: '13px', fontWeight: 700, color: '#888', letterSpacing: '0.06em', marginBottom: '10px', textTransform: 'uppercase' }}>
      {children}
    </p>
  )
}

export default function Login({ mode, onBack, onLogin }) {
  // ── 학생: 반대표 / 전교임원 트랙 ──
  const [track, setTrack] = useState(null) // 'class' | 'school'

  const [grade, setGrade] = useState(null)
  const [cls, setCls]     = useState(null)
  const [position, setPosition] = useState(null)

  const [schoolPosition, setSchoolPosition] = useState(null)
  const [schoolGrade, setSchoolGrade]       = useState(null)

  // ── 관리자 PIN ──
  const [pin, setPin]     = useState('')
  const [pinError, setPinError] = useState('')
  const [loading, setLoading]   = useState(false)

  function selectGrade(g) {
    setGrade(g)
    const classes = GRADE_CLASSES[g]
    setCls(classes.length === 1 ? classes[0] : null)
  }

  function selectTrack(t) {
    setTrack(t)
    setGrade(null); setCls(null); setPosition(null)
    setSchoolPosition(null); setSchoolGrade(null)
  }

  function enterAsClassRep() {
    onLogin({ type: 'student', mode: 'class', grade, class: cls, position })
  }

  function enterAsSchoolOfficer() {
    if (schoolPosition === '전교부회장') {
      onLogin({ type: 'student', mode: 'school', position: schoolPosition, grade: schoolGrade })
    } else {
      onLogin({ type: 'student', mode: 'school', position: schoolPosition })
    }
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

  const currentClasses = grade ? GRADE_CLASSES[grade] : []
  const singleClass    = currentClasses.length === 1

  const wrapStyle = {
    minHeight: '100vh',
    background: 'var(--color-canvas-oat)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px'
  }

  /* ── 관리자 모드 ── */
  if (mode === 'teacher') {
    return (
      <div style={wrapStyle}>
        <div className="card" style={{ width: '100%', maxWidth: '380px' }}>
          <button className="btn-ghost" onClick={onBack} style={{ marginBottom: '12px' }}>← 뒤로</button>
          <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '6px' }}>관리자 모드</h2>
          <p style={{ color: '#777', fontSize: '14px', marginBottom: '24px' }}>
            PIN 번호를 입력해주세요
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
          <button
            className="btn-primary"
            onClick={handleTeacherLogin}
            disabled={loading || !pin.trim()}
            style={{ width: '100%' }}
          >
            {loading ? <span className="spinner" /> : '입장하기'}
          </button>
        </div>
      </div>
    )
  }

  /* ── 학생 모드: 트랙 선택 ── */
  if (!track) {
    return (
      <div style={wrapStyle}>
        <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
          <button className="btn-ghost" onClick={onBack} style={{ marginBottom: '12px' }}>← 뒤로</button>
          <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '20px' }}>학생 입장</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="btn-primary" onClick={() => selectTrack('class')} style={{ width: '100%', padding: '18px' }}>
              반 대표로 입장
            </button>
            <button className="btn-secondary" onClick={() => selectTrack('school')} style={{ width: '100%', padding: '18px', fontSize: '15px' }}>
              전교 임원으로 입장
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── 반 대표 트랙 ── */
  if (track === 'class') {
    return (
      <div style={wrapStyle}>
        <div className="card" style={{ width: '100%', maxWidth: '460px' }}>
          <button className="btn-ghost" onClick={() => selectTrack(null)} style={{ marginBottom: '12px' }}>← 뒤로</button>

          <Label>학년 선택</Label>
          <PillRow options={GRADES} value={grade} onSelect={selectGrade} render={g => `${g}학년`} />

          <div style={{ overflow: 'hidden', maxHeight: grade ? '400px' : '0', opacity: grade ? 1 : 0, transition: 'max-height 0.25s ease, opacity 0.2s' }}>
            {singleClass ? (
              <div className="alert alert-info" style={{ marginBottom: '28px' }}>
                {grade}학년은 1반 하나입니다. 자동으로 선택되었어요.
              </div>
            ) : (
              <>
                <Label>반 선택</Label>
                <PillRow options={currentClasses} value={cls} onSelect={setCls} render={c => `${c}반`} />
              </>
            )}

            {cls && (
              <>
                <Label>직위 선택</Label>
                <PillRow options={CLASS_POSITIONS} value={position} onSelect={setPosition} />
              </>
            )}
          </div>

          <button
            className="btn-primary"
            onClick={enterAsClassRep}
            disabled={!grade || !cls || !position}
            style={{ width: '100%', fontSize: '16px', padding: '18px' }}
          >
            {grade && cls && position ? `${grade}학년 ${cls}반 ${position}으로 입장` : '학년·반·직위를 선택해주세요'}
          </button>
        </div>
      </div>
    )
  }

  /* ── 전교 임원 트랙 ── */
  return (
    <div style={wrapStyle}>
      <div className="card" style={{ width: '100%', maxWidth: '440px' }}>
        <button className="btn-ghost" onClick={() => selectTrack(null)} style={{ marginBottom: '12px' }}>← 뒤로</button>

        <Label>직위 선택</Label>
        <PillRow
          options={SCHOOL_POSITIONS}
          value={schoolPosition}
          onSelect={p => { setSchoolPosition(p); setSchoolGrade(null) }}
        />

        <div style={{
          overflow: 'hidden',
          maxHeight: schoolPosition === '전교부회장' ? '200px' : '0',
          opacity: schoolPosition === '전교부회장' ? 1 : 0,
          transition: 'max-height 0.25s ease, opacity 0.2s'
        }}>
          <Label>학년 선택</Label>
          <PillRow options={SCHOOL_DEPUTY_GRADES} value={schoolGrade} onSelect={setSchoolGrade} render={g => `${g}학년`} />
        </div>

        <button
          className="btn-primary"
          onClick={enterAsSchoolOfficer}
          disabled={!schoolPosition || (schoolPosition === '전교부회장' && !schoolGrade)}
          style={{ width: '100%', fontSize: '16px', padding: '18px' }}
        >
          {schoolPosition === '전교부회장'
            ? (schoolGrade ? `${schoolGrade}학년 전교부회장으로 입장` : '학년을 선택해주세요')
            : schoolPosition ? '전교회장으로 입장' : '직위를 선택해주세요'}
        </button>
      </div>
    </div>
  )
}
