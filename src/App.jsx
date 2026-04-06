import { useState, useEffect } from 'react';
import Editor from './components/Editor';
import Auth from './components/Auth';

function App() {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('notes_token');
    const savedUsername = localStorage.getItem('notes_username');
    if (savedToken) {
      setToken(savedToken);
      setUsername(savedUsername);
    }
  }, []);

  const handleLogin = (newToken, newUsername) => {
    localStorage.setItem('notes_token', newToken);
    localStorage.setItem('notes_username', newUsername);
    setToken(newToken);
    setUsername(newUsername);
  };

  const handleLogout = () => {
    localStorage.removeItem('notes_token');
    localStorage.removeItem('notes_username');
    setToken(null);
    setUsername('');
  };

  return (
    <div className="w-screen h-screen m-0 p-0 overflow-hidden bg-[#0d1117]">
      {token ? (
        <Editor token={token} username={username} onLogout={handleLogout} />
      ) : (
        <Auth onAuthSuccess={handleLogin} />
      )}
    </div>
  );
}

export default App;