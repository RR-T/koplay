import { createRoot } from 'react-dom/client';
import { SocketProvider } from '../shared/context/SocketContext';
import App from './App';
import '../index.css';

createRoot(document.getElementById('root')).render(
  <SocketProvider role="tv">
    <App />
  </SocketProvider>
);
