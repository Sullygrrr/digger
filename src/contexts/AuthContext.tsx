import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { generateDefaultUsername } from '../utils/generateUsername';

interface AuthContextType {
  currentUser: User | null;
  username: string | null;
  signup: (email: string, password: string) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  setUsername: (uid: string, username: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [username, setUsernameState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const signup = async (email: string, password: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Générer un username par défaut
    const defaultUsername = generateDefaultUsername();
    
    // Créer le document utilisateur avec l'username par défaut
    await setDoc(doc(db, 'users', user.uid), {
      username: defaultUsername,
      email: user.email,
      createdAt: new Date()
    });
    
    // Réserver l'username dans la collection usernames
    await setDoc(doc(db, 'usernames', defaultUsername.toLowerCase()), {
      uid: user.uid
    });
    
    setUsernameState(defaultUsername);
    return user;
  };

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password)
      .then(({ user }) => user);
  };

  const logout = () => {
    return signOut(auth);
  };

  const setUsername = async (uid: string, username: string) => {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { username }, { merge: true });
    setUsernameState(username);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUsernameState(userDoc.data().username);
        }
      } else {
        setUsernameState(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    username,
    signup,
    login,
    logout,
    setUsername,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};