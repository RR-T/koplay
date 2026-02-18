const SOUNDS = [
  { id: 'sound_00', name: 'Boing Hit' },
  { id: 'sound_01', name: 'Sneeze' },
  { id: 'sound_02', name: 'Clown Nose' },
  { id: 'sound_03', name: 'Monkey' },
  { id: 'sound_04', name: 'Dazzle Birds' },
  { id: 'sound_05', name: 'Failure Piano' },
  { id: 'sound_06', name: 'Fart' },
  { id: 'sound_07', name: 'Friendly Kiss' },
  { id: 'sound_08', name: 'Laugh Voice' },
  { id: 'sound_09', name: 'Quick Splat' },
  { id: 'sound_10', name: 'Sad Horn' },
  { id: 'sound_11', name: 'Strong Fart' },
  { id: 'sound_12', name: 'Toy Whistle' },
  { id: 'sound_13', name: 'Cartoon Laugh' },
  { id: 'sound_14', name: 'Clown Sound' },
  { id: 'sound_15', name: 'Cow Moo' },
  { id: 'sound_16', name: 'Dog Bark' },
  { id: 'sound_17', name: 'Falling Scream' },
  { id: 'sound_18', name: 'Fast Splat' },
  { id: 'sound_19', name: 'Squeaky Toy' },
  { id: 'sound_20', name: 'System Break' },
  { id: 'sound_21', name: 'Horse Snort' },
  { id: 'sound_22', name: 'Hard Pop' },
  { id: 'sound_23', name: 'Kitty Meow' },
  { id: 'sound_24', name: 'Trombone' },
];

SOUNDS.forEach((sound) => {
  sound.play = () => {
    const audio = new Audio(`/sounds/${sound.id}.wav`);
    audio.play().catch(() => {});
  };
});

export function playSoundById(id) {
  const sound = SOUNDS.find((s) => s.id === id);
  if (sound) sound.play();
}

export default SOUNDS;
