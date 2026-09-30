import { useState } from 'react'
import Home from './screens/Home'
import Login from './screens/Login'
import Student from './screens/Student'
import Teacher from './screens/Teacher'
import { DEMO_USER_STUDENT, DEMO_USER_TEACHER } from './lib/demoData'

export default function App() {
  const [stage, setStage] = useState('home')
  const [user, setUser] = useState(null)

  function handleLogin(userData) {
    setUser(userData)
    setStage(userData.type === 'teacher' ? 'teacher' : 'student')
  }

  function handleDemoStudent() {
    setUser(DEMO_USER_STUDENT)
    setStage('student')
  }

  function handleDemoTeacher() {
    setUser(DEMO_USER_TEACHER)
    setStage('teacher')
  }

  function handleBack() {
    setUser(null)
    setStage('home')
  }

  if (stage === 'home') {
    return (
      <Home
        onLoginStudent={() => setStage('login-student')}
        onLoginTeacher={() => setStage('login-teacher')}
        onDemoStudent={handleDemoStudent}
        onDemoTeacher={handleDemoTeacher}
      />
    )
  }

  if (stage === 'login-student') {
    return (
      <Login
        type="student"
        onLogin={handleLogin}
        onBack={() => setStage('home')}
      />
    )
  }

  if (stage === 'login-teacher') {
    return (
      <Login
        type="teacher"
        onLogin={handleLogin}
        onBack={() => setStage('home')}
      />
    )
  }

  if (stage === 'student') {
  return <Student user={user} onLogout={handleBack} />
}

if (stage === 'teacher') {
  return <Teacher user={user} onLogout={handleBack} />
}

  return null
}
