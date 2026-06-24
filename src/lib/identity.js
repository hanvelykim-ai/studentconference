// 학년별 반 목록
export const GRADE_CLASSES = {
  2: [1, 2, 3, 4],
  3: [1, 2],
  4: [1, 2],
  5: [1, 2],
  6: [1]
}
export const GRADES = Object.keys(GRADE_CLASSES).map(Number)

// 회의 참여 체크 대상 학년 (4-6학년만)
export const MEETING_GRADES = [4, 5, 6]

export const CLASS_POSITIONS = ['회장', '남부회장', '여부회장']
export const SCHOOL_POSITIONS = ['전교회장', '전교부회장']
export const SCHOOL_DEPUTY_GRADES = [5, 6] // 전교부회장 학년

// user: { type:'student', mode:'class', grade, class, position }
//     | { type:'student', mode:'school', position, grade? }
export function identityKey(user) {
  if (!user) return null
  if (user.mode === 'class') return `c-${user.grade}-${user.class}-${user.position}`
  if (user.mode === 'school') {
    return user.position === '전교부회장' ? `s-전교부회장-${user.grade}` : 's-전교회장'
  }
  return null
}

export function classKey(user) {
  if (user?.mode !== 'class') return null
  return `${user.grade}-${user.class}`
}

export function identityLabel(user) {
  if (!user) return ''
  if (user.mode === 'class') return `${user.grade}학년 ${user.class}반 ${user.position}`
  if (user.position === '전교부회장') return `${user.grade}학년 전교부회장`
  return '전교회장'
}

// 회의 참여 체크 탭을 볼 수 있는지 (4-6학년 반대표만 체크 가능, 전교임원은 조회만)
export function canSeeMeetings(user) {
  if (user?.mode === 'class') return MEETING_GRADES.includes(user.grade)
  if (user?.mode === 'school') return true
  return false
}

export function canCheckAttendance(user) {
  return user?.mode === 'class' && MEETING_GRADES.includes(user.grade)
}

// 모든 직위 슬롯 목록 (관리자: 학생 등록 / 할 일 배정용)
export function allSlots() {
  const slots = []
  for (const g of GRADES) {
    for (const c of GRADE_CLASSES[g]) {
      for (const p of CLASS_POSITIONS) {
        slots.push({ key: `c-${g}-${c}-${p}`, label: `${g}학년 ${c}반 ${p}`, grade: g, class: c })
      }
    }
  }
  slots.push({ key: 's-전교회장', label: '전교회장' })
  for (const g of SCHOOL_DEPUTY_GRADES) {
    slots.push({ key: `s-전교부회장-${g}`, label: `${g}학년 전교부회장`, grade: g })
  }
  return slots
}
