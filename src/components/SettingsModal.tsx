import React, { useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Settings, User, Lock, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [newUsername, setNewUsername] = useState('');
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

  const handleUsernameChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    if (!validateUsername(newUsername)) {
      return;
    }
    
    setLoading(true);
    try {
      // Vérifier la dernière modification du username
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const lastUsernameChange = userDoc.data()?.lastUsernameChange?.toDate() || new Date(0);
      const daysSinceLastChange = (new Date().getTime() - lastUsernameChange.getTime()) / (1000 * 3600 * 24);

      if (daysSinceLastChange < 21) {
        const daysRemaining = Math.ceil(21 - daysSinceLastChange);
        toast.error(`Vous devez attendre encore ${daysRemaining} jours avant de changer votre username`);
        return;
      }

      // Vérifier si le nouveau username est disponible
      const usernameDoc = await getDoc(doc(db, 'usernames', newUsername.toLowerCase()));
      if (usernameDoc.exists()) {
        toast.error('Ce nom d\'utilisateur est déjà pris');
        return;
      }

      // Mettre à jour le username
      await setDoc(doc(db, 'usernames', newUsername.toLowerCase()), {
        uid: currentUser.uid
      });
      
      // Mettre à jour les informations utilisateur
      await setDoc(doc(db, 'users', currentUser.uid), {
        username: newUsername,
        lastUsernameChange: new Date()
      }, { merge: true });
      
      await setAuthUsername(currentUser.uid, newUsername);
      toast.success('Nom d\'utilisateur mis à jour');
      setNewUsername('');
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!currentUser?.email) return;
    
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      toast.success('Email de réinitialisation envoyé');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de l\'email');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-dark-100 rounded-2xl p-8 shadow-xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-accent-purple to-accent-blue flex items-center justify-center">
            <Settings className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Paramètres</h2>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleUsernameChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-accent-purple" />
                Nouveau nom d'utilisateur
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full p-3 bg-dark-200 rounded-xl border border-gray-700 focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-colors text-white"
                placeholder="Nouveau username"
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
              {loading ? 'Modification...' : 'Changer le username'}
            </button>
          </form>

          <div className="border-t border-gray-700 pt-6">
            <button
              onClick={handlePasswordReset}
              className="w-full py-3 px-4 bg-dark-200 rounded-xl text-white font-medium hover:bg-dark-100 transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-5 h-5" />
              Réinitialiser le mot de passe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};