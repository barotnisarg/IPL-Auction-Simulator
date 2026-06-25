// server/utils/shuffleArray.js

const shuffleArray = (inputArray) => {
  const shuffled = [...inputArray];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }

  return shuffled;
};

module.exports = shuffleArray;