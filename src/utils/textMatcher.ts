import { Animal } from '../types';

/**
 * Remove Vietnamese accents/diacritics and trim punctuation for flexible matching
 */
export function removeVietnameseTones(str: string): string {
  let s = str.toLowerCase();
  s = s.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  s = s.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  s = s.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  s = s.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  s = s.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  s = s.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  s = s.replace(/đ/g, 'd');
  // Combine Unicode marks removal as secondary safety
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Remove special characters, keep alphanumeric and single spaces
  s = s.replace(/[^a-z0-9\s]/gi, ' ').replace(/\s+/g, ' ').trim();
  return s;
}

/**
 * Normalize raw input string for matching
 */
export function normalizeInput(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'…]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Check if the user's free text matches the target animal
 */
export function checkAnimalAnswer(userInput: string, animal: Animal): {
  isCorrect: boolean;
  matchedWord?: string;
  feedbackMessage: string;
} {
  const rawInput = normalizeInput(userInput);
  if (!rawInput) {
    return {
      isCorrect: false,
      feedbackMessage: 'Bé hãy nhập hoặc chọn tên con vật nhé!',
    };
  }

  const unaccentedInput = removeVietnameseTones(rawInput);

  // List of all valid target terms (accented & unaccented)
  const targetTerms: string[] = [
    animal.name,
    animal.englishName,
    ...(animal.synonyms || []),
  ];

  // Also add common variations without prefixes
  const pureNames = [
    animal.name.replace(/^(con|chú|bạn|bé|loài)\s+/i, ''),
    ...(animal.synonyms || []).map((s) => s.replace(/^(con|chú|bạn|bé|loài)\s+/i, '')),
  ];

  const allPossibleTargets = Array.from(
    new Set([...targetTerms, ...pureNames].map((t) => normalizeInput(t)).filter(Boolean))
  );

  // Check 1: Exact match with any target
  for (const target of allPossibleTargets) {
    if (rawInput === target || unaccentedInput === removeVietnameseTones(target)) {
      return {
        isCorrect: true,
        matchedWord: animal.name,
        feedbackMessage: `Chính xác rồi! Đây là ${animal.name} (${animal.englishName})! 🎉`,
      };
    }
  }

  // Check 2: Substring or containment match
  // E.g. user typed "đây là con voi" -> contains "con voi" or "voi"
  for (const target of allPossibleTargets) {
    const unaccentedTarget = removeVietnameseTones(target);
    if (
      (rawInput.includes(target) && target.length >= 2) ||
      (unaccentedInput.includes(unaccentedTarget) && unaccentedTarget.length >= 2)
    ) {
      return {
        isCorrect: true,
        matchedWord: animal.name,
        feedbackMessage: `Bé giỏi quá! Đáp án đúng là ${animal.name}! 🌟`,
      };
    }
  }

  return {
    isCorrect: false,
    feedbackMessage: `Chưa đúng rồi bé ơi! Bé hãy thử lại hoặc nghe cô gợi ý nhé! 💪`,
  };
}
