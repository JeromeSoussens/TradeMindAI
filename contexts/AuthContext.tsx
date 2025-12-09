
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storageService } from '../services/storageService';

interface User {
  id: string;
  name: string;
  email: string;
  photoURL: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in local storage (client-side session only)
    const storedUser = localStorage.getItem('trademind_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signInWithGoogle = async () => {
    // SIMULATED GOOGLE AUTHENTICATION
    // In a real app, you would use firebase.auth().signInWithPopup(provider)
    
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        const mockUser: User = {
          id: 'user_12345',
          name: 'Demo Trader',
          email: 'trader@example.com',
          photoURL: 'https://ui-avatars.com/api/?name=Demo+Trader&background=3b82f6&color=fff'
        };
        
        // SYNC USER WITH DATABASE
        await storageService.syncUser(mockUser);

        setUser(mockUser);
        localStorage.setItem('trademind_user', JSON.stringify(mockUser));
        resolve();
      }, 1000); 
    });
  };

  const signOut = async () => {
    return new Promise<void>((resolve) => {
      setUser(null);
      localStorage.removeItem('trademind_user');
      resolve();
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
