export function isKorean(str: string) {
  const pattern = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;

  return pattern.test(str);
}

export function isEnglish(str: string) {
  const pattern = /[a-zA-Z]/;

  return pattern.test(str);
}
