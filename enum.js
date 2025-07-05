// make a polyfill of enum in js
function Enum(obj) {
  const enumValues = {};
  for (const key in obj) {
    enumValues[key] = key;
  }
  return Object.freeze(enumValues);
}

function enumFromStrings(array) {
  return Object.fromEntries(array.map((item) => [item.toString(), item]));
}

module.exports = {
  Enum,
  enumFromStrings,
};