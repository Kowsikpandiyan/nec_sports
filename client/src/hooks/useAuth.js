import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Access Auth state and helpers
 */
const useAuth = () => {
  return useContext(AuthContext);
};

export default useAuth;
