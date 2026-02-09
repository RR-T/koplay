import { lazy } from 'react';

export default {
  id: 'trivia',
  name: 'Trivia',
  description: 'Answer questions across 3 rounds — easy, medium, hard!',
  TVComponent: lazy(() => import('./TriviaTV.jsx')),
  PhoneComponent: lazy(() => import('./TriviaPhone.jsx')),
};
