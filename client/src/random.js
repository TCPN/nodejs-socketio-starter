const presetCharSet = {
  2: '01',
  16: '0123456789abcdef',
  36: '0123456789abcdefghijklmnopqrstuvwxyz',
  62: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  64: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_',
}

export function randomString(len, charSet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') {
  if (charSet in presetCharSet) {
    charSet = presetCharSet[charSet]
  }
  const chars = [];
  for (let i = 0; i < len; i++) {
    chars.push(charSet.charAt(Math.floor(Math.random() * charSet.length)));
  }
  return chars.join('');
}
