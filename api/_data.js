import { kv } from '@vercel/kv'

const DEFAULT_SETTINGS = {
  teacherPin: '1234',
  aiProvider: 'claude',
  claudeApiKey: '',
  geminiApiKey: ''
}

export const getTopics   = async () => (await kv.get('sga:topics'))      ?? []
export const getSubs     = async () => (await kv.get('sga:submissions'))  ?? []
export const getSums     = async () => (await kv.get('sga:summaries'))    ?? []
export const getSettings = async () => (await kv.get('sga:settings'))     ?? { ...DEFAULT_SETTINGS }
export const getMeetings = async () => (await kv.get('sga:meetings'))     ?? []
export const getElections= async () => (await kv.get('sga:elections'))   ?? []
export const getStudents = async () => (await kv.get('sga:students'))    ?? []
export const getTodos    = async () => (await kv.get('sga:todos'))       ?? []

export const setTopics   = v => kv.set('sga:topics', v)
export const setSubs     = v => kv.set('sga:submissions', v)
export const setSums     = v => kv.set('sga:summaries', v)
export const setSettings = v => kv.set('sga:settings', v)
export const setMeetings = v => kv.set('sga:meetings', v)
export const setElections= v => kv.set('sga:elections', v)
export const setStudents = v => kv.set('sga:students', v)
export const setTodos    = v => kv.set('sga:todos', v)
