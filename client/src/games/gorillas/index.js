import { lazy } from 'react';

export default {
  id: 'gorillas',
  name: 'Gorillas',
  description: 'Throw bananas across the skyline!',
  TVComponent: lazy(() => import('./GorillasTV.jsx')),
  PhoneComponent: lazy(() => import('./GorillasPhone.jsx')),
};
