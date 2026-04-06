import { useState } from 'react';

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const endpoint = isLogin ? '/api/login' : '/api/signup';
    
    try {
      const response = await fetch(`https://bringesh-notes-api.onrender.com${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Something went wrong.');
      } else {
        onAuthSuccess(data.token, data.username);
      }
    } catch (err) {
      setError('Failed to connect to server.');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0d1117] font-sans">
      <div className="w-full max-w-md p-8 bg-[#161b22] border border-gray-800 rounded-xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">{isLogin ? 'Welcome Back' : 'Create an Account'}</h1>
          <p className="text-gray-400 text-sm">{isLogin ? 'Enter your credentials to access your workspace.' : 'Sign up to start organizing your notes.'}</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 text-red-400 text-sm rounded-lg text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
            <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white transition-all" placeholder="Enter your username" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white transition-all" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={isLoading} className="w-full mt-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-md transition-all disabled:opacity-50">
            {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}