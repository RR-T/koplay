import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SocketProvider } from '../shared/context/SocketContext';
import App from './App';
import IntroScreen from './screens/IntroScreen';
import LoginScreen from './screens/LoginScreen';
import '../index.css';

const pathname = window.location.pathname;
const searchParams = new URLSearchParams(window.location.search);
const quizId = searchParams.get('quiz') || undefined;

// /screen/<uuid> → auto-auth with UUID from URL
const autoToken = pathname.startsWith('/screen/') ? pathname.slice('/screen/'.length) || null : null;
// /screen → show login form
const isLoginMode = pathname === '/screen' && !autoToken;

function TVRoot() {
  const [introFinished, setIntroFinished] = useState(false);
  const [manualToken, setManualToken] = useState(null);
  const [loginError, setLoginError] = useState(null);

  const authToken = autoToken || manualToken || undefined;
  const screenMode = isLoginMode ? 'manual' : undefined;

  // /screen login: show login form first (user gesture enables autoplay inside App)
  if (isLoginMode && !manualToken) {
    return <LoginScreen onLogin={setManualToken} error={loginError} />;
  }

  // /screen/<uuid>: play intro before connecting socket
  if (autoToken && !introFinished) {
    return <IntroScreen onComplete={() => setIntroFinished(true)} />;
  }

  return (
    <SocketProvider
      role="tv"
      authToken={authToken}
      screenMode={screenMode}
      quizId={quizId}
      onAuthError={(msg) => {
        setManualToken(null);
        setLoginError(msg || 'Invalid access code');
      }}
    >
      <App skipIntro={!!autoToken} />
    </SocketProvider>
  );
}

createRoot(document.getElementById('root')).render(<TVRoot />);
