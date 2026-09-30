// 전시용 둘러보기 모드 Mock 데이터

export const DEMO_USER_STUDENT = {
  type: 'student',
  mode: 'class',
  grade: 5,
  class: 1,
  position: '회장',
  demo: true
}

export const DEMO_USER_TEACHER = {
  type: 'teacher',
  demo: true
}

export const DEMO_MEETINGS = [
  {
    id: 'demo-m1',
    title: '9월 학생자치회 정기회의',
    date: '2024-09-10',
    location: '도서관',
    agenda: '학교 행사 계획 및 건의사항 논의',
    status: 'completed',
    attendance: {
      'c-2-1-회장': true,
      'c-2-2-회장': true,
      'c-3-1-회장': false,
      'c-4-1-회장': true,
      'c-5-1-회장': true,
      'c-5-2-회장': true,
      'c-6-1-회장': true,
      's-전교회장': true,
      's-전교부회장-5': true,
      's-전교부회장-6': false,
    }
  },
  {
    id: 'demo-m2',
    title: '10월 학생자치회 정기회의',
    date: '2024-10-08',
    location: '시청각실',
    agenda: '이달의 안건 및 학교 축제 준비',
    status: 'upcoming',
    attendance: {}
  }
]

export const DEMO_ELECTIONS = [
  {
    id: 'demo-e1',
    title: '2학기 전교 학생회 임원 선거',
    date: '2024-08-28',
    description: '전교회장 및 전교부회장 선출',
    candidates: [
      { name: '김민준', position: '전교회장', grade: 6, class: 1 },
      { name: '이서연', position: '전교회장', grade: 6, class: 1 },
      { name: '박지호', position: '전교부회장(5학년)', grade: 5, class: 2 },
      { name: '최하은', position: '전교부회장(6학년)', grade: 6, class: 1 },
    ],
    result: '김민준(전교회장), 박지호(5학년 전교부회장), 최하은(6학년 전교부회장) 당선',
    status: 'completed'
  }
]

export const DEMO_TOPICS = [
  {
    id: 'demo-t1',
    title: '복도에서 안전하게 이동하는 방법',
    description: '쉬는 시간 복도 안전 문제에 대해 우리가 스스로 지킬 수 있는 방법을 이야기해봐요.',
    category: '협의사항',
    meetingId: 'demo-m1',
    status: 'completed',
    createdAt: '2024-09-05T09:00:00.000Z'
  },
  {
    id: 'demo-t2',
    title: '학교 시설 개선 건의',
    description: '학교 시설 중 개선이 필요한 곳을 건의해 주세요.',
    category: '건의사항',
    meetingId: 'demo-m1',
    status: 'completed',
    createdAt: '2024-09-05T09:00:00.000Z'
  },
  {
    id: 'demo-t3',
    title: '10월 학교 축제 행사 계획',
    description: '10월에 진행할 학교 축제에서 하고 싶은 활동을 제안해 주세요.',
    category: '이달의안건',
    meetingId: 'demo-m2',
    status: 'pending',
    createdAt: '2024-10-01T09:00:00.000Z'
  }
]

export const DEMO_SUBMISSIONS = [
  // 협의사항 submissions
  { id: 'demo-s1', topicId: 'demo-t1', grade: 2, class: 1, content: '복도에서 뛰지 않고 오른쪽으로 걷기\n계단에서는 한 줄로 내려오기' },
  { id: 'demo-s2', topicId: 'demo-t1', grade: 3, class: 1, content: '복도에서 절대 뛰지 않기\n큰 소리로 떠들지 않기\n친구를 밀거나 장난치지 않기' },
  { id: 'demo-s3', topicId: 'demo-t1', grade: 4, class: 1, content: '복도 오른쪽 통행 지키기\n점심시간에 특히 조심하기\n다른 반 수업 방해하지 않기' },
  { id: 'demo-s4', topicId: 'demo-t1', grade: 5, class: 1, content: '복도에서 뛰지 않기\n계단 손잡이 잡고 걷기\n하교 시간에 안전하게 이동하기' },
  { id: 'demo-s5', topicId: 'demo-t1', grade: 5, class: 2, content: '오른쪽으로 질서있게 걷기\n소리지르지 않기\n급하게 뛰어다니지 않기' },
  { id: 'demo-s6', topicId: 'demo-t1', grade: 6, class: 1, content: '복도 우측 통행 지키기\n다른 사람 배려하며 걷기\n비상 상황 대비 대피로 숙지' },

  // 건의사항 submissions
  { id: 'demo-s7', topicId: 'demo-t2', grade: 2, class: 1, content: '운동장 그늘막이 없어서 여름에 놀기 힘들어요. 그늘막 설치해주세요.\n정수기가 자주 고장나서 불편해요.' },
  { id: 'demo-s8', topicId: 'demo-t2', grade: 3, class: 1, content: '화장실 비누가 자주 비어 있어요. 자주 채워주세요.\n급식실 앞 정수기 점검 부탁해요.' },
  { id: 'demo-s9', topicId: 'demo-t2', grade: 4, class: 1, content: '도서관 책이 너무 오래됐어요. 새 책 구입해주세요.\n운동장 그늘이 없어서 더워요.' },
  { id: 'demo-s10', topicId: 'demo-t2', grade: 5, class: 1, content: '체육관 농구골대가 고장났어요. 수리 부탁해요.\n보건실 앞 의자가 부족해요.' },

  // 이달의안건 submissions
  { id: 'demo-s11', topicId: 'demo-t3', grade: 2, class: 1, content: '공룡 만들기 체험 부스 하고 싶어요!\n페이스 페인팅 해요!' },
  { id: 'demo-s12', topicId: 'demo-t3', grade: 3, class: 1, content: '탈출방 게임 하면 재미있을 것 같아요\n각 반이 다른 나라를 주제로 꾸미기' },
  { id: 'demo-s13', topicId: 'demo-t3', grade: 5, class: 1, content: '학교 마당에서 마켓 열기\n미니 놀이기구 체험\n선생님과 학생 대결 피구' },
]

export const DEMO_SUMMARIES = {
  'demo-t1': {
    id: 'demo-sum1',
    topicId: 'demo-t1',
    summary: `[안전 보행 수칙]
- 복도에서는 반드시 뛰지 않고 걷기
- 복도 우측 통행 규칙 지키기
- 계단 이용 시 손잡이를 잡고 한 줄로 이동하기

[소음 및 예절]
- 복도에서 큰 소리로 떠들거나 소리지르지 않기
- 다른 반 수업을 방해하지 않도록 조용히 이동하기

[배려 실천]
- 친구를 밀거나 장난치지 않기
- 다른 사람을 배려하며 질서 있게 이동하기`,
    aiProvider: 'claude',
    submissionCount: 6,
    createdAt: '2024-09-10T14:00:00.000Z'
  },
  'demo-t2': {
    id: 'demo-sum2',
    topicId: 'demo-t2',
    summary: `[건의사항]
- 운동장에 그늘막을 추가로 설치해 주시면 감사하겠습니다.
- 급식실 앞 정수기 점검 및 유지 관리를 부탁드립니다.
- 화장실 비누를 정기적으로 채워 주시기 바랍니다.
- 도서관에 최신 도서를 추가 구입해 주시면 감사하겠습니다.
- 체육관 농구골대 수리를 부탁드립니다.`,
    aiProvider: 'claude',
    submissionCount: 4,
    createdAt: '2024-09-10T14:30:00.000Z'
  }
}

export const DEMO_TODOS = [
  {
    id: 'demo-todo1',
    title: '10월 학교 축제 준비 계획서 작성',
    description: '각 반에서 운영할 부스 계획서를 작성하여 10월 1일까지 제출해주세요.',
    dueDate: '2024-10-01',
    assignedTo: ['c-5-1-회장', 'c-6-1-회장', 's-전교회장'],
    createdAt: '2024-09-10T15:00:00.000Z',
    completedBy: { 'c-6-1-회장': true }
  },
  {
    id: 'demo-todo2',
    title: '9월 회의록 배부 및 확인',
    description: '9월 학생자치회 회의 결과를 각 반에 안내하고 확인 서명을 받아오세요.',
    dueDate: '2024-09-17',
    assignedTo: ['c-2-1-회장', 'c-3-1-회장', 'c-4-1-회장', 'c-5-1-회장', 'c-5-2-회장', 'c-6-1-회장'],
    createdAt: '2024-09-10T15:00:00.000Z',
    completedBy: {
      'c-2-1-회장': true,
      'c-5-1-회장': true,
      'c-6-1-회장': true
    }
  }
]

export const DEMO_STUDENTS = [
  { slotKey: 'c-5-1-회장', name: '김민서' },
  { slotKey: 'c-5-1-남부회장', name: '이준호' },
  { slotKey: 'c-5-1-여부회장', name: '박소연' },
  { slotKey: 'c-5-2-회장', name: '정다은' },
  { slotKey: 'c-6-1-회장', name: '최현우' },
  { slotKey: 's-전교회장', name: '김민준' },
  { slotKey: 's-전교부회장-5', name: '박지호' },
  { slotKey: 's-전교부회장-6', name: '최하은' },
]
