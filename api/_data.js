import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

function getDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    })
  }
  return getFirestore()
}

const DEFAULT_SETTINGS = {
  teacherPin: '1234',
  aiProvider: 'claude',
  claudeApiKey: '',
  geminiApiKey: ''
}

async function get(key) {
  const doc = await getDb().collection('sga').doc(key).get()
  return doc.exists ? doc.data().value : null
}

async function set(key, value) {
  await getDb().collection('sga').doc(key).set({ value })
}

export const getTopics   = async () => (await get('topics'))      ?? []
export const getSubs     = async () => (await get('submissions'))  ?? []
export const getSums     = async () => (await get('summaries'))    ?? []
export const getSettings = async () => (await get('settings'))     ?? { ...DEFAULT_SETTINGS }

export const setTopics   = v => set('topics', v)
export const setSubs     = v => set('submissions', v)
export const setSums     = v => set('summaries', v)
export const setSettings = v => set('settings', v)
