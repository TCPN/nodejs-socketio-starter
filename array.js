function removeFromArray(array, item) {
  const index = array.indexOf(item);
  if (index >= 0) {
    array.splice(index, 1);
    return true;
  }
  return false
}

function transferItem(item, srcArr, dstArr) {
  removeFromArray(srcArr, item);
  dstArr.push(item);
}

module.exports = {
  removeFromArray,
  transferItem,
};
