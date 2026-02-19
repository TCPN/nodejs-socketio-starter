function makeArray(item) {
  if (Array.isArray(item)) {
    return item;
  }
  return [item];
}

function removeFromArray(array, item) {
  const index = array?.indexOf(item);
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
  makeArray,
  removeFromArray,
  transferItem,
};
