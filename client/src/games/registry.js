import gorillas from './gorillas/index.js';
import acrophobia from './acrophobia/index.js';
import trivia from './trivia/index.js';

const gameRegistry = new Map();
gameRegistry.set(gorillas.id, gorillas);
gameRegistry.set(acrophobia.id, acrophobia);
gameRegistry.set(trivia.id, trivia);

export default gameRegistry;

export const availableGames = [
  { id: 'lobby', name: 'Lobby', description: 'Chill in the lobby' },
  { id: 'gorillas', name: 'Gorillas', description: 'Throw bananas across the skyline!' },
  { id: 'acrophobia', name: 'Acrophobia', description: 'Make up funny acronyms and vote for the best!' },
  { id: 'trivia', name: 'Trivia', description: 'Answer questions across 3 rounds — easy, medium, hard!' },
];
