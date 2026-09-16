import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.studentconference_KV_REST_API_URL,
  token: process.env.studentconference_KV_REST_API_TOKEN,
})

const DEFAULT_SETTINGS = {
  teacherPin: '1234',
  aiProvider: 'claude',
  claudeApiKey: '',
  geminiApiKey: ''
}

export const getTopics    = async () => (await redis.get('sga:topics'))      ?? []
export const getSubs      = async () => (await redis.get('sga:submissions'))  ?? []
export const getSums      = async () => (await redis.get('sga:summaries'))    ?? []
export const getSettings  = async () => (await redis.get('sga:settings'))     ?? { ...DEFAULT_SETTINGS }
export const getMeetings  = async () => (await redis.get('sga:meetings'))     ?? []
export const getElections = async () => (await redis.get('sga:elections'))    ?? []
export const getStudents  = async () => (await redis.get('sga:students'))     ?? []
export const getTodos     = async () => (await redis.get('sga:todos'))        ?? []

export const setTopics    = v => redis.set('sga:topics', v)
export const setSubs      = v => redis.set('sga:submissions', v)
export const setSums      = v => redis.set('sga:summaries', v)
export const setSettings  = v => redis.set('sga:settings', v)
export const setMeetings  = v => redis.set('sga:meetings', v)
export const setElections = v => redis.set('sga:elections', v)
export const setStudents  = v => redis.set('sga:students', v)
export const setTodos     = v => redis.set('sga:todos', v)
