import React, { useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { User } from 'lucide-react';
import toast from 'react-hot-toast';

interface UsernameModalProps {
  onComplete: () => void;
}

export const UsernameModal: React.FC<UsernameModalProps> = ({ onComplete }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser, setUsername: setAuthUsername } = useAuth();

  const validateUsername = (username: string): boolean => {
    // Vérifier la longueur minimale
    if (username.length < 4) {
      toast.error('Le nom d\'utilisateur doit contenir au moins 4 caractères');
      return false;
    }

    // Vérifier les caractères autorisés (lettres, chiffres, -, _, .)
    const validUsernameRegex = /^[a-zA-Z0-9\-_\.]+$/;
    if (!validUsernameRegex.test(username)) {
      toast.error('Seuls les lettres, chiffres, -, _ et . sont autorisés');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    if (!validateUsername(username)) {
      return;
    }
    
    setLoading(true);
    try {
      const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()));
      if (usernameDoc.exists()) {
        toast.error('Ce nom d\'utilisateur est déjà pris');
        return;
      }

      await setDoc(doc(db, 'usernames', username.toLowerCase()), {
        uid: currentUser.uid
      });
      
      await setAuthUsername(currentUser.uid, username);
      toast.success('Nom d\'utilisateur enregistré');
      onComplete();
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-dark-100 rounded-2xl p-8 shadow-xl w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-accent-purple to-accent-blue flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-center mb-6 text-white">
          Choisissez votre nom d'utilisateur
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-dark-200 rounded-xl border border-gray-700 focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-colors text-white"
              placeholder="Nom d'utilisateur"
              required
              minLength={4}
            />
            <p className="mt-2 text-sm text-gray-400">
              Minimum 4 caractères, lettres, chiffres, -, _ et . uniquement
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-accent-purple to-accent-blue rounded-xl text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : 'Confirmer'}
          </button>
        </form>
      </div>
    </div>
  );
};