import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UsernameModal } from '../components/UsernameModal';
import { UserPlus, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await signup(email, password);
      setShowUsernameModal(true);
    } catch (error) {
      toast.error('Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameComplete = () => {
    navigate('/');
  };

  return (
    <>
      <div className="min-h-screen bg-dark text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-dark-100 rounded-2xl p-8 shadow-xl">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-accent-purple to-accent-blue flex items-center justify-center">
                <UserPlus className="w-8 h-8" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-accent-purple to-accent-blue bg-clip-text text-transparent">
              Créer un compte
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-accent-purple" />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-dark-200 rounded-xl border border-gray-700 focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-accent-purple" />
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-dark-200 rounded-xl border border-gray-700 focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-colors"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-accent-purple to-accent-blue rounded-xl text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Inscription...'
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    S'inscrire
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-gray-400">
              Déjà un compte ?{' '}
              <Link 
                to="/login" 
                className="text-accent-purple hover:text-accent-blue transition-colors"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
      {showUsernameModal && <UsernameModal onComplete={handleUsernameComplete} />}
    </>
  );
};