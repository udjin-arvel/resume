import {
    createContext,
    useState,
    useEffect,
    useMemo,
  } from 'react';
  import { jwtDecode } from 'jwt-decode';
  import { useCookie } from '@shared';
  
  // JWT Decoded User interface
  interface DecodedUser {
    email?: string;
    id?: number;
    role?: string;
    exp?: number;
    subscription_status?: string | null;
    is_onboarded?: boolean;
    test_days_left?: number | null;
    [key: string]: unknown;
  }
  
  // Auth Context Value interface
  interface AuthContextValue {
    user: DecodedUser | null;
    authToken: string | null | undefined;
    setUser: React.Dispatch<React.SetStateAction<DecodedUser | null>>;
    setAuthToken: React.Dispatch<React.SetStateAction<string | null | undefined>>;
  }
  
  // Auth Provider Props interface
  interface AuthProviderProps {
    children: React.ReactNode;
  }
  
  export const AuthContext = createContext<AuthContextValue | null>(null);
  
  export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const decode = (token: string | null | undefined): DecodedUser | null => {
      try {
        if (token) {
          return jwtDecode(token) as DecodedUser;
        }
        
      } catch (error) {
        console.error('Error decoding token:', error);
        // deleteCookie('radar');
      }
      return null;
    };
  
    const [value] = useCookie('radar');
    const initialToken = value || null;
    const initialUser = decode(initialToken);
    const [authToken, setAuthToken] = useState<string | null | undefined>(initialToken);
    const [user, setUser] = useState<DecodedUser | null>(initialUser);
    let prevToken = authToken;
  
    useEffect(() => {
      if (value && value !== prevToken) {
        const user = decode(value);
        setAuthToken(value);
        setUser(user);
    
      }
      console.log('user', user);
    }, [value]);
  
  
   
  
   
   
   
  
  
    const contextData = useMemo<AuthContextValue>(
      () => ({
        user,
        authToken,
        setUser,
        setAuthToken,
      }),
      [user, authToken]
    );
  
    return (
      <AuthContext.Provider value={contextData}>{children}</AuthContext.Provider>
    );
  };
  