
import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '@shared/schema';

interface AuthContextType {
  user: Partial<User> | null;
  login: (user: Partial<User>) => void;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return a default implementation when used outside provider
    const [user, setUser] = useState<Partial<User> | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      // Check if user is logged in
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('supabase_token');
      
      if (savedUser && token) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          localStorage.removeItem('user');
          localStorage.removeItem('supabase_token');
        }
      }
      setIsLoading(false);
    }, []);

    const login = (userData: Partial<User>) => {
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('supabase_token');
    };

    const isAuthenticated = !!user;

    return { user, login, logout, isLoading, isAuthenticated };
  }
  return context;
}

export { AuthContext };
export type { AuthContextType };
