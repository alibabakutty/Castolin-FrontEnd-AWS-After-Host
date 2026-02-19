import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/authConstants';

const AdminAuthForm = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { loginAdmin } = useAuth();

  const handleSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters!', {
        position: 'bottom-right',
        autoClose: 3000,
      });
      setIsLoading(false);
      return;
    }

    try {
      const loginResult = await loginAdmin(email, password);
      if (loginResult.success) {
        if (loginResult.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/unauthorized');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Signup failed. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    return password.trim() !== '' && email.trim() !== '' && password.length >= 6;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header */}
          <div className="text-center">
            <h3 className="text-xl font-amasis text-white">{'Admin Login'}</h3>
            <p className="text-white/70 text-xs font-amasis mt-1">{'Welcome back!'}</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-white/80 text-xs font-amasis mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 outline-none focus:border-blue-400 text-sm font-amasis"
                placeholder="Enter email"
                disabled={isLoading}
                autoComplete='off'
              />
            </div>

            <div>
              <label className="block text-white/80 text-xs font-amasis mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 outline-none focus:border-blue-400 text-sm font-amasis"
                placeholder="Enter password"
                disabled={isLoading}
                autoComplete='off'
              />
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={!isFormValid() || isLoading}
              className={`w-full py-2 rounded-lg font-semibold text-white transition-colors text-sm ${
                !isFormValid() || isLoading
                  ? 'bg-white/10 cursor-not-allowed text-white/50'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {'Logging in...'}
                </div>
              ) : (
                'Login as Admin'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAuthForm;