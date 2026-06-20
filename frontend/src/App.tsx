import './App.css'
import { Route, BrowserRouter as Router, Routes, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import MemberProfilePage from './pages/MemberProfilePage'
import GroupDetailsPage from './pages/GroupDetailsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import AppLayout from './components/Layout/AppLayout'
import { GroupProvider } from './context/GroupContext'
import { ProtectedAppLayout } from './components/Layout/ProtectedAppLayout'
import ErrorBoundary from './components/Common/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <GroupProvider>
        <AuthProvider>
          <NotificationProvider>
            <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route element={<ProtectedAppLayout />}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/member/:userId" element={<MemberProfilePage />} />
                <Route path="/group-details/:groupId" element={<GroupDetailsPage />} />
                <Route path="/analytics/:groupId" element={<AnalyticsPage />} />
              </Route>
              </Routes>
            </Router>

            {/* Toast notifications container */}
            <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
              pauseOnHover
              theme="dark"
            />
          </NotificationProvider>
        </AuthProvider>
      </GroupProvider>
    </ErrorBoundary>
  )
}

export default App
