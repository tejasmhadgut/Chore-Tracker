import React from 'react'
import LoginForm from '../components/Authentication/LoginForm'
import Footer from '../components/Footer/Footer'
import Logo from '../components/Logo/Logo'

const LoginPage = () => {
  return (
    <div className='bg-slate-900 min-h-screen flex flex-col'>
      <nav className='bg-slate-900/85 backdrop-blur-sm border-b border-slate-700 py-4'>
        <div className='max-w-7xl mx-auto px-4'>
          <Logo size={32} variant="full" className='text-cyan-400' />
        </div>
      </nav>
      <div className='flex-1'>
        <LoginForm />
      </div>
      <Footer />
    </div>
  )
}

export default LoginPage