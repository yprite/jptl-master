type LocaleMode = "ko" | "ja" | "mixed";

const MIXED_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bVerb\b/g, "동사"],
  [/\bNoun\b/g, "명사"],
  [/\bAdjective\b/g, "형용사"],
  [/い-Adjective/g, "い형용사"],
  [/な-Adjective/g, "な형용사"],
  [/\bVS\b/g, "대조"],
  [/\bto iu\b/gi, "と いう"],
  [/\bcheat(?:ing)?\b/gi, "부정행위"],
];

const KOREAN_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bSNS\b/g, "소셜 미디어"],
  [/\bKTX\b/g, "고속열차"],
  [/\bJR\b/g, "일본철도"],
  [/\bIT\b/g, "정보기술"],
  [/\bLED\b/g, "발광다이오드"],
  [/([0-9]+)\s*cm\b/gi, "$1센티미터"],
  [/([0-9]+)\s*km\b/gi, "$1킬로미터"],
];

const JAPANESE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bSNS\b/g, "ソーシャルメディア"],
  [/\bKTX\b/g, "韓国高速鉄道"],
  [/\bJR\b/g, "日本鉄道"],
  [/\bIT\b/g, "情報技術"],
  [/\bLED\b/g, "発光ダイオード"],
  [/([0-9]+)\s*cm\b/gi, "$1センチメートル"],
  [/([0-9]+)\s*km\b/gi, "$1キロメートル"],
];

function applyReplacements(
  text: string,
  replacements: Array<[RegExp, string]>
): string {
  return replacements.reduce((result, [pattern, replacement]) => {
    return result.replace(pattern, replacement);
  }, text);
}

export function localizeStudyText(text: string | null | undefined, locale: LocaleMode = "mixed"): string {
  if (!text) {
    return "";
  }

  if (/^\s*영문 번역:/u.test(text)) {
    return "";
  }

  let next = text.replace(/\s*Hanabira 설명:.*$/u, "");
  next = applyReplacements(next, MIXED_REPLACEMENTS);

  if (locale === "ko" || locale === "mixed") {
    next = applyReplacements(next, KOREAN_REPLACEMENTS);
  }

  if (locale === "ja") {
    next = applyReplacements(next, JAPANESE_REPLACEMENTS);
  }

  return next.replace(/\s{2,}/g, " ").trim();
}
