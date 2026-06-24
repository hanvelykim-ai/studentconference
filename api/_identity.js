// 학생 식별자 유틸 (반대표 / 전교임원)
// user: { mode: 'class', grade, class, position } | { mode: 'school', position, grade? }

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
