import { useState } from 'react'
import Login from './screens/Login.jsx'
import Student from './screens/Student.jsx'
import Teacher from './screens/Teacher.jsx'

export default function App() {
  const [user, setUser] = useState(null)

  if (!user) return <Login onLogin={setUser} />
  if (user.type === 'teacher') return <Teacher onLogout={() => setUser(null)} />
  return <Student user={user} onLogout={() => setUser(null)} />
}
