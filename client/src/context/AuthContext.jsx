import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { connectSocket, disconnectSocket } from '../lib/socket';
import toast from 'react-hot-toast';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadMe = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data && response.data.data) {
        setUser(response.data.data);
        connectSocket(); // Authenticate Socket.IO connection
      }
    } catch (err) {
      console.log('Failed to restore user session.');
      logoutState();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadMe();
    } else {
      setLoading(false);
    }
    return () => disconnectSocket();
  }, [accessToken]);

  const logoutState = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    disconnectSocket();
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data && response.data.data) {
        const { accessToken: newToken, user: userData } = response.data.data;
        
        localStorage.setItem('accessToken', newToken);
        setAccessToken(newToken);
        setUser(userData);
        connectSocket();

        toast.success('Welcome back!');
        return { success: true };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please check credentials.';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout request failed on server.');
    } finally {
      logoutState();
      toast.success('Logged out successfully.');
      navigate('/login');
    }
  };

  const refreshSessionToken = async () => {
    try {
      const response = await api.post('/auth/refresh-token');
      if (response.data && response.data.data) {
        const { accessToken: newToken } = response.data.data;
        localStorage.setItem('accessToken', newToken);
        setAccessToken(newToken);
        return newToken;
      }
    } catch (err) {
      logoutState();
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        logout,
        refreshSessionToken,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
