import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Log authentication state for debugging
    console.log('[ProtectedRoute] Auth State:', { user: user?.email, loading });
  }, [user, loading]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#999',
        backgroundColor: '#0f172a'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    console.log('[ProtectedRoute] No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('[ProtectedRoute] User authenticated:', user.email);
  return <>{children}</>;
};
