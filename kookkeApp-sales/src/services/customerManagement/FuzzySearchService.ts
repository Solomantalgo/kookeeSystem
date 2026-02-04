/**
 * Fuzzy Search Service
 * Implements Levenshtein distance algorithm for typo-tolerant customer search
 * Handles: name variations, typos, partial matches, local language variations
 */

import { Customer } from '../../types/customerManagement';

export interface FuzzySearchResult {
  customer: Customer;
  score: number; // 0-1, where 1 is perfect match
  matchField: 'name' | 'address' | 'phone';
  matchType: 'exact' | 'fuzzy' | 'partial';
}

export interface FuzzySearchOptions {
  threshold?: number; // 0-1, minimum match score
  maxResults?: number;
  searchFields?: ('name' | 'address' | 'phone')[];
  caseSensitive?: boolean;
}

export class FuzzySearchService {
  private static readonly DEFAULT_THRESHOLD = 0.6;
  private static readonly DEFAULT_MAX_RESULTS = 50;
  private static readonly DEFAULT_SEARCH_FIELDS = ['name', 'address'];

  /**
   * Main fuzzy search method
   * Returns customers matching the query with relevance scores
   */
  search(
    query: string,
    customers: Customer[],
    options: FuzzySearchOptions = {}
  ): FuzzySearchResult[] {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const {
      threshold = FuzzySearchService.DEFAULT_THRESHOLD,
      maxResults = FuzzySearchService.DEFAULT_MAX_RESULTS,
      searchFields = FuzzySearchService.DEFAULT_SEARCH_FIELDS,
      caseSensitive = false,
    } = options;

    const normalizedQuery = caseSensitive ? query : query.toLowerCase();
    const results: FuzzySearchResult[] = [];

    for (const customer of customers) {
      const matchResults = this.matchCustomer(
        customer,
        normalizedQuery,
        searchFields,
        caseSensitive
      );

      if (matchResults) {
        results.push(matchResults);
      }
    }

    // Filter by threshold and sort by score
    return results
      .filter((r) => r.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  /**
   * Try to match a customer against the query
   * Returns the best match or null
   */
  private matchCustomer(
    customer: Customer,
    query: string,
    searchFields: string[],
    caseSensitive: boolean
  ): FuzzySearchResult | null {
    let bestScore = 0;
    let bestField: 'name' | 'address' | 'phone' = 'name';
    let bestMatchType: 'exact' | 'fuzzy' | 'partial' = 'fuzzy';

    // Search in name
    if (searchFields.includes('name')) {
      const nameScore = this.scoreField(customer.name || '', query, caseSensitive);
      if (nameScore.score > bestScore) {
        bestScore = nameScore.score;
        bestField = 'name';
        bestMatchType = nameScore.matchType;
      }
    }

    // Search in address
    if (searchFields.includes('address') && customer.address) {
      const addressScore = this.scoreField(customer.address, query, caseSensitive);
      if (addressScore.score > bestScore) {
        bestScore = addressScore.score;
        bestField = 'address';
        bestMatchType = addressScore.matchType;
      }
    }

    // Search in phone
    if (searchFields.includes('phone') && customer.phoneNumber) {
      const phoneScore = this.scoreField(customer.phoneNumber, query, caseSensitive);
      if (phoneScore.score > bestScore) {
        bestScore = phoneScore.score;
        bestField = 'phone';
        bestMatchType = phoneScore.matchType;
      }
    }

    if (bestScore > 0) {
      return {
        customer,
        score: bestScore,
        matchField: bestField,
        matchType: bestMatchType,
      };
    }

    return null;
  }

  /**
   * Score a field against the query
   */
  private scoreField(
    field: string,
    query: string,
    caseSensitive: boolean
  ): { score: number; matchType: 'exact' | 'fuzzy' | 'partial' } {
    const normalizedField = caseSensitive ? field : field.toLowerCase();

    // Exact match
    if (normalizedField === query) {
      return { score: 1.0, matchType: 'exact' };
    }

    // Starts with (high priority for names)
    if (normalizedField.startsWith(query)) {
      return { score: 0.95, matchType: 'partial' };
    }

    // Contains substring
    if (normalizedField.includes(query)) {
      return { score: 0.8, matchType: 'partial' };
    }

    // Fuzzy match using Levenshtein
    const distance = this.levenshteinDistance(normalizedField, query);
    const maxLength = Math.max(normalizedField.length, query.length);
    const similarityScore = 1 - distance / maxLength;

    if (similarityScore >= 0.6) {
      return { score: similarityScore, matchType: 'fuzzy' };
    }

    return { score: 0, matchType: 'fuzzy' };
  }

  /**
   * Calculate Levenshtein distance between two strings
   * Measures minimum number of single-character edits needed
   * Lower distance = more similar strings
   */
  levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    // Create matrix
    const matrix: number[][] = Array(len1 + 1)
      .fill(null)
      .map(() => Array(len2 + 1).fill(0));

    // Initialize first row and column
    for (let i = 0; i <= len1; i++) {
      matrix[i][0] = i;
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] =
            Math.min(
              matrix[i - 1][j] + 1, // deletion
              matrix[i][j - 1] + 1, // insertion
              matrix[i - 1][j - 1] + 1 // substitution
            );
        }
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Check if query matches any word in a phrase
   * Useful for multi-word searches
   */
  matchesAnyWord(phrase: string, query: string, caseSensitive: boolean = false): boolean {
    const normalizedPhrase = caseSensitive ? phrase : phrase.toLowerCase();
    const normalizedQuery = caseSensitive ? query : query.toLowerCase();

    const words = normalizedPhrase.split(/\s+/);
    return words.some((word) => {
      const distance = this.levenshteinDistance(word, normalizedQuery);
      return distance <= 2; // Allow up to 2 character differences
    });
  }

  /**
   * Calculate Jaro-Winkler similarity (alternative to Levenshtein)
   * Often preferred for name matching
   */
  jaroWinklerSimilarity(str1: string, str2: string): number {
    const jaro = this.jaroSimilarity(str1, str2);

    // If strings match up to a certain length, boost the score
    const prefix = this.commonPrefixLength(str1, str2);
    const scalingFactor = 0.1;

    return jaro + prefix * scalingFactor * (1 - jaro);
  }

  /**
   * Calculate Jaro similarity
   */
  private jaroSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0 && len2 === 0) {
      return 1.0;
    }
    if (len1 === 0 || len2 === 0) {
      return 0.0;
    }

    const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
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

    if (matches === 0) {
      return 0.0;
    }

    // Find transpositions
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (!str1Matches[i]) {
        continue;
      }
      while (!str2Matches[k]) {
        k++;
      }
      if (str1[i] !== str2[k]) {
        transpositions++;
      }
      k++;
    }

    return (
      (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) /
      3
    );
  }

  /**
   * Get the length of the common prefix
   */
  private commonPrefixLength(str1: string, str2: string): number {
    let length = 0;
    const minLen = Math.min(str1.length, str2.length);

    for (let i = 0; i < minLen; i++) {
      if (str1[i] === str2[i]) {
        length++;
      } else {
        break;
      }
    }

    return Math.min(length, 4); // Maximum prefix length of 4
  }

  /**
   * Search for customers matching multiple keywords (AND operator)
   */
  searchMultiple(
    queries: string[],
    customers: Customer[],
    options: FuzzySearchOptions = {}
  ): FuzzySearchResult[] {
    if (queries.length === 0) {
      return [];
    }

    // Start with first query
    let results = this.search(queries[0], customers, {
      ...options,
      threshold: 0.5, // Lower threshold for intermediate results
    });

    // Apply AND operator for subsequent queries
    for (let i = 1; i < queries.length; i++) {
      const subResults = this.search(queries[i], results.map((r) => r.customer), {
        ...options,
        threshold: 0.5,
      });
      results = subResults;
    }

    // Re-sort by combined score
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, options.maxResults || FuzzySearchService.DEFAULT_MAX_RESULTS);
  }
}

export default FuzzySearchService;
