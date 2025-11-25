// audio setup
const keyStrokeSounds = [
  new Audio("/sounds/keystroke1.mp3"),
  new Audio("/sounds/keystroke2.mp3"),
  new Audio("/sounds/keystroke3.mp3"),
  new Audio("/sounds/keystroke4.mp3"),
];

function useKeyboardSound() {
  const playRandomStrokeSound = () => {
    const index = Math.floor(Math.random() * keyStrokeSounds.length);
    const randomSound = keyStrokeSounds[index];

    if (!randomSound) return; // safety check

    randomSound.currentTime = 0;
    randomSound.play().catch((error) =>
      console.log(`Audio play failed: ${error}`)
    );
  };

  return { playRandomStrokeSound };
}

export default useKeyboardSound;
