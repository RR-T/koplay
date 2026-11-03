import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SocketProvider } from '../shared/context/SocketContext';
import App from './App';
import CodeEntryScreen from './screens/CodeEntryScreen';
import '../index.css';

document.body.classList.add('phone-body');

const params = new URLSearchParams(window.location.search);
const urlCode = (params.get('code') || '').toUpperCase().slice(0, 5);

function PhoneRoot() {
  const [code, setCode] = useState(urlCode);
  const [codeError, setCodeError] = useState('');

  function handleCode(c, err) {
    if (err) { setCodeError(err); return; }
    setCode(c);
    setCodeError('');
  }

  if (!code) {
    return <CodeEntryScreen onCode={handleCode} error={codeError} />;
  }

  return (
    <SocketProvider role="player" code={code}>
      <App onInvalidCode={() => { setCode(''); setCodeError('Game session ended'); }} />
    </SocketProvider>
  );
}

createRoot(document.getElementById('root')).render(<PhoneRoot />);
