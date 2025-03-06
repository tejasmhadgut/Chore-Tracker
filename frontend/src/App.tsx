import './App.css'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import CreateGroupPage from './pages/CreateGroupPage'
import ProfilePage from './pages/ProfilePage'
import GroupDetailsPage from './pages/GroupDetailsPage'

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage/>} />
        <Route path="/register" element={<RegisterPage/>} />
        <Route path="/home" element={<HomePage/>} />
        <Route path="/create-group" element={<CreateGroupPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/group-details/:groupId" element={<GroupDetailsPage />} />
      </Routes>
    </Router>
  )
}

export default App
