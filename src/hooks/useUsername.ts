import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useUsername = (userId: string) => {
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setUsername(userDoc.data().username || '');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du username:', error);
      }
    };

    if (userId) {
      fetchUsername();
    }
  }, [userId]);

  return username;
};