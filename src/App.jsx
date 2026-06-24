import { useState } from 'react'
import Home from './screens/Home.jsx'
import Login from './screens/Login.jsx'
import Student from './screens/Student.jsx'
import Teacher from './screens/Teacher.jsx'

export default function App() {
  const [stage, setStage] = useState('home') // 'home' | 'login-student' | 'login-teacher'
  const [user, setUser] = useState(null)

  function logout() {
    setUser(null)
    setStage('home')
  }

  if (user?.type === 'teacher') return <Teacher onLogout={logout} />
  if (user?.type === 'student') return <Student user={user} onLogout={logout} />

  if (stage === 'login-student') {
    return <Login mode="student" onBack={() => setStage('home')} onLogin={setUser} />
  }
  if (stage === 'login-teacher') {
    return <Login mode="teacher" onBack={() => setStage('home')} onLogin={setUser} />
  }

  return (
    <Home
      onStudentEnter={() => setStage('login-student')}
      onTeacherEnter={() => setStage('login-teacher')}
    />
  )
}
