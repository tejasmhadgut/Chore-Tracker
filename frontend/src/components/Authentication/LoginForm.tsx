import React, { useState } from 'react';
import { login, googleLogin } from '../../services/AuthService';
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';

const LoginForm: React.FC = () => {
  const [userName, setUserName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(userName, password);
      navigate('/home');
      //localStorage.setItem('authToken', response.token);
      //alert('Login Successful!');
    } catch (err: unknown) {
        if(err instanceof Error)
        {
            setError(err.message);
        } else {
            setError('An unexpected error occurred');
        }
      
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await googleLogin();
      localStorage.setItem('authToken', response.token);
      alert('Google Login Successful!');
    } catch (err: unknown) {
        if(err instanceof Error)
            {
                setError(err.message);
            } else {
                setError('An unexpected error occurred');
            }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-[sans-serif] min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <motion.div className="grid md:grid-cols-2 w-full items-center"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Left Side - Text */}
        <motion.div className="text-left px-25"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        >
          <motion.h2 className="lg:text-5xl text-3xl font-extrabold lg:leading-[55px] text-gray-800"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          >
          Simplify Your Chores, Simplify Your Life!
          </motion.h2>
          <motion.p className="text-sm mt-6 text-gray-800"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          >
          Ready to take control of your chores? Login now to effortlessly manage tasks, track your progress, and keep your home running smoothly with your roommates!
          </motion.p>
          <motion.p className="text-sm mt-6 text-gray-800"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          >
            Want to be part of the Crew? 
            <a href="/register" className="text-blue-600 font-semibold hover:underline ml-1">
              Register here
            </a> and get back to organizing your chores.
          </motion.p>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div className="flex justify-left"
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
            <motion.h3 className="text-gray-800 text-3xl font-extrabold mb-6 text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 2 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            >Login</motion.h3>

            {error && <motion.p className="text-red-500 text-sm text-center mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            >{error}</motion.p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div
              
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + 1 * 0.1 }}
              >
                <input
                  type="text"
                  className="bg-gray-100 w-full text-sm text-gray-800 px-4 py-3.5 rounded-md outline-blue-600 focus:bg-transparent"
                  value={userName}
                  placeholder="Username"
                  onChange={(e) => setUserName(e.target.value)}
                  required
                />
              </motion.div>
              <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + 1 * 0.1 }}
              >
                <input
                  type="password"
                  className="bg-gray-100 w-full text-sm text-gray-800 px-4 py-3.5 rounded-md outline-blue-600 focus:bg-transparent"
                  value={password}
                  placeholder="Password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </motion.div>

              <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
                type="submit"
                className="w-full shadow-xl py-2.5 px-4 text-sm font-semibold rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </motion.button>
            </form>

            {/* Google Login Button */}
            <div className="mt-4">
              <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
                onClick={handleGoogleLogin}
                className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login with Google'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginForm;
