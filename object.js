function isSafeToEmit(obj) {
  try {
    JSON.stringify(obj); // 無循環才會成功
    return true;
  } catch (err) {
    console.error(err);
    console.log(obj);
    return false;
  }
}

module.exports = {
  isSafeToEmit,
};
