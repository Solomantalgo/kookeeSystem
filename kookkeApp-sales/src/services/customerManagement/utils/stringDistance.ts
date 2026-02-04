/**
 * String Distance Utilities
 * 
 * Implements various string distance algorithms for fuzzy matching.
 */

/**
 * Levenshtein Distance (Edit Distance)
 * 
 * Calculates minimum number of single-character edits (insertions, deletions, substitutions)
 * required to change one string into another.
 * 
 * @param str1 First string
 * @param str2 Second string
 * @returns Edit distance (0 = identical, higher = more different)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create a 2D array for dynamic programming
  const matrix: number[][] = [];

  // Initialize first row and column
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Levenshtein Similarity (normalized 0-1)
 * 
 * @param str1 First string
 * @param str2 Second string
 * @returns Similarity score (1 = identical, 0 = completely different)
 */
export function levenshteinSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1; // Both empty strings are identical
  
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

/**
 * Jaro-Winkler Distance
 * 
 * Similar to Jaro but with additional weight for matching prefix.
 * Good for short strings like names.
 * 
 * @param str1 First string
 * @param str2 Second string
 * @param scaling Prefix scaling factor (default 0.1)
 * @returns Similarity score (0-1)
 */
export function jaroWinklerSimilarity(
  str1: string,
  str2: string,
  scaling: number = 0.1
): number {
  const jaro = jaroSimilarity(str1, str2);

  if (jaro < 0.7) return jaro;

  // Find common prefix (up to 4 characters)
  let prefix = 0;
  const maxPrefix = Math.min(Math.min(str1.length, str2.length), 4);
  for (let i = 0; i < maxPrefix; i++) {
    if (str1[i] === str2[i]) {
      prefix++;
    } else {
      break;
    }
  }

  return jaro + prefix * scaling * (1 - jaro);
}

/**
 * Jaro Distance
 * 
 * Measures similarity considering common characters and their order.
 * Better for longer strings.
 * 
 * @param str1 First string
 * @param str2 Second string
 * @returns Similarity score (0-1)
 */
function jaroSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0 && len2 === 0) return 1;
  if (len1 === 0 || len2 === 0) return 0;

  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
  if (matchDistance < 0) return 0;

  const str1Matches = new Array(len1).fill(false);
  const str2Matches = new Array(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);

    for (let j = start; j < end; j++) {
      if (str2Matches[j] || str1[i] !== str2[j]) {
        continue;
      }
      str1Matches[i] = true;
      str2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  // Count transpositions
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!str1Matches[i]) continue;
    while (!str2Matches[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }

  const jaro =
    (matches / len1 +
      matches / len2 +
      (matches - transpositions / 2) / matches) /
    3;

  return jaro;
}

/**
 * Soundex Code
 * 
 * Phonetic algorithm - useful for handling pronunciation-based typos.
 * Returns 4-character code where similar sounding strings have similar codes.
 * 
 * @param str String to encode
 * @returns Soundex code
 */
export function soundex(str: string): string {
  const s = str
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .replace(/[AEIOUYHW]/g, '0')
    .replace(/[BFPV]/g, '1')
    .replace(/[CGJKQSXZ]/g, '2')
    .replace(/[DT]/g, '3')
    .replace(/[L]/g, '4')
    .replace(/[MN]/g, '5')
    .replace(/[R]/g, '6');

  return (s[0] + s.substring(1).replace(/0/g, '').replace(/[0-9]/g, (match, offset) => {
    const prev = s[offset - 1];
    return prev === match ? '' : match;
  })).substring(0, 4).padEnd(4, '0');
}

/**
 * Metaphone Phonetic Code
 * 
 * Similar to Soundex but with better accuracy for English.
 * 
 * @param str String to encode
 * @returns Metaphone code
 */
export function metaphone(str: string): string {
  let s = str.toUpperCase().replace(/[^A-Z]/g, '');

  // Remove duplicate consecutive letters
  s = s.replace(/(.)\1+/g, '$1');

  // Rules for first character
  if (s.startsWith('KN')) s = s.substring(1);
  if (s.startsWith('WR')) s = s.substring(1);
  if (s.startsWith('X')) s = 'S' + s.substring(1);

  // Replace at the beginning
  s = s
    .replace(/^(A|E|I|O|U)/, 'A')
    .replace(/^WH/, 'W')
    .replace(/PH/, 'F')
    .replace(/TCH|CH/, 'X')
    .replace(/DG/, 'J')
    .replace(/GH/, 'H')
    .replace(/CK/, 'K');

  // Replace in middle and end
  s = s
    .replace(/QU/, 'KW')
    .replace(/[AEIOUY]/g, 'A')
    .replace(/Z/, 'S')
    .replace(/^H/, '')
    .replace(/[WHY]$/, '')
    .replace(/DG/, 'J')
    .replace(/GN/, 'N')
    .replace(/KN/, 'N')
    .replace(/MP/, 'M')
    .replace(/TCH/, 'X');

  // Remove duplicate consecutive letters again
  s = s.replace(/(.)\1+/g, '$1');

  return s.substring(0, 4).padEnd(4, '0');
}

/**
 * Phonetic similarity using Soundex
 * 
 * @param str1 First string
 * @param str2 Second string
 * @returns true if Soundex codes match
 */
export function soundexMatch(str1: string, str2: string): boolean {
  return soundex(str1) === soundex(str2);
}

/**
 * Combined Fuzzy Match Score
 * 
 * Combines multiple algorithms for best accuracy:
 * - Exact match (100)
 * - Levenshtein similarity (60%)
 * - Jaro-Winkler similarity (30%)
 * - Soundex/Metaphone match (10%)
 * 
 * @param search Search term
 * @param target Target string
 * @returns Similarity score (0-100)
 */
export function combinedFuzzyScore(search: string, target: string): number {
  if (search === target) return 100;

  const searchLower = search.toLowerCase();
  const targetLower = target.toLowerCase();

  // Substring match
  if (targetLower.includes(searchLower)) {
    return targetLower.startsWith(searchLower) ? 95 : 85;
  }

  // Weighted combination
  const levScore = levenshteinSimilarity(searchLower, targetLower) * 60;
  const jaroScore = jaroWinklerSimilarity(searchLower, targetLower) * 30;
  const phoneticMatch = soundexMatch(searchLower, targetLower) ? 10 : 0;

  return levScore + jaroScore + phoneticMatch;
}
