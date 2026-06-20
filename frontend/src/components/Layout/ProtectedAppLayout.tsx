import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppLayout from './AppLayout';

interface ProtectedAppLayoutProps {
  children?: React.ReactNode;
}

export const ProtectedAppLayout: React.FC<ProtectedAppLayoutProps> = ({ children }) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log('[ProtectedAppLayout] Auth State:', { user: user?.email, loading });
  }, [user, loading]);

  // While loading auth state, show full-page loading screen
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        fontSize: '18px',
        color: '#999',
        backgroundColor: '#0f172a',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999
      }}>
        Loading...
      </div>
    );
  }

  // If no user, redirect to login
  if (!user) {
    console.log('[ProtectedAppLayout] No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, render the app layout
  console.log('[ProtectedAppLayout] User authenticated:', user.email);
  return <AppLayout />;
};
