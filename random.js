function randomPick(array) {
  return array[Math.min(Math.floor(Math.random() * array.length), array.length - 1)];
}

module.exports = {
  randomPick,
};
