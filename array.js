function removeFromArray(array, item) {
  const index = array.indexOf(item);
  if (index >= 0) {
    array.splice(index, 1);
    return true;
  }
  return false
}

module.exports = {
  removeFromArray,
};