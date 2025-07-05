const { enumFromStrings } = require("./enum");

const gameItems = enumFromStrings([
  'CANDLE',
  'CAKE',
]);

module.exports = {
  gameItems,
};
