import { createRoot } from 'react-dom/client';
import { SocketProvider } from '../shared/context/SocketContext';
import App from './App';
import '../index.css';

document.body.classList.add('phone-body');

createRoot(document.getElementById('root')).render(
  <SocketProvider role="player">
    <App />
  </SocketProvider>
);
