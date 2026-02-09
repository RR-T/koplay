import { lazy } from 'react';

export default {
  id: 'acrophobia',
  name: 'Acrophobia',
  description: 'Make up funny acronyms and vote for the best!',
  TVComponent: lazy(() => import('./AcrophobiaTV.jsx')),
  PhoneComponent: lazy(() => import('./AcrophobiaPhone.jsx')),
};
