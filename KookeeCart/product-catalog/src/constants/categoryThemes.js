import {
    TERRACOTTA, AMBER, SAGE, WARM_EARTH, DEEP_CLAY,
    MINT, SKY_BLUE, CREAM, SOFT_CREAM, TEXT_COLOR
} from './colors';
import {
    ADINKRA_PATTERN, OIL_DROP_PATTERN, DOT_PATTERN,
    TEXTURE_PATTERN, GEOMETRIC_PATTERN, getPatternDataUrl
} from './patterns';

// Category-specific themes with African-inspired backgrounds
export const categoryThemes = {
    // Cosmetic Oils - Warm amber with oil drops
    'cosmetic oils': {
        gradient: `linear-gradient(135deg, ${AMBER} 0%, ${TERRACOTTA} 100%)`,
        pattern: getPatternDataUrl(OIL_DROP_PATTERN),
        patternColor: DEEP_CLAY,
        textColor: TEXT_COLOR,
        cardBackground: 'rgba(255, 255, 255, 0.95)'
    },

    'topclass oils': {
        gradient: `linear-gradient(135deg, ${AMBER} 0%, ${TERRACOTTA} 100%)`,
        pattern: getPatternDataUrl(OIL_DROP_PATTERN),
        patternColor: DEEP_CLAY,
        textColor: TEXT_COLOR,
        cardBackground: 'rgba(255, 255, 255, 0.95)'
    },

    // Ice Cream - Cool mint with playful dots
    'ice cream': {
        gradient: `linear-gradient(135deg, ${MINT} 0%, ${SKY_BLUE} 100%)`,
        pattern: getPatternDataUrl(DOT_PATTERN),
        patternColor: '#2C5F7D',
        textColor: TEXT_COLOR,
        cardBackground: 'rgba(255, 255, 255, 0.95)'
    },

    // Spices - Terracotta with African geometric patterns
    'spices': {
        gradient: `linear-gradient(135deg, ${TERRACOTTA} 0%, ${DEEP_CLAY} 100%)`,
        pattern: getPatternDataUrl(ADINKRA_PATTERN),
        patternColor: '#5A2D0C',
        textColor: TEXT_COLOR,
        cardBackground: 'rgba(255, 255, 255, 0.95)'
    },

    'natures own spices': {
        gradient: `linear-gradient(135deg, ${TERRACOTTA} 0%, ${DEEP_CLAY} 100%)`,
        pattern: getPatternDataUrl(ADINKRA_PATTERN),
        patternColor: '#5A2D0C',
        textColor: TEXT_COLOR,
        cardBackground: 'rgba(255, 255, 255, 0.95)'
    },

    // Dairy - Fresh cream with subtle texture
    'dairy': {
        gradient: `linear-gradient(135deg, ${CREAM} 0%, ${SOFT_CREAM} 100%)`,
        pattern: getPatternDataUrl(TEXTURE_PATTERN),
        patternColor: '#D4A574',
        textColor: TEXT_COLOR,
        cardBackground: 'rgba(255, 255, 255, 0.95)'
    },

    'cheese': {
        gradient: `linear-gradient(135deg, ${CREAM} 0%, ${SOFT_CREAM} 100%)`,
        pattern: getPatternDataUrl(TEXTURE_PATTERN),
        patternColor: '#D4A574',
        textColor: TEXT_COLOR,
        cardBackground: 'rgba(255, 255, 255, 0.95)'
    },

    'emborg non-dairy': {
        gradient: `linear-gradient(135deg, ${CREAM} 0%, ${SOFT_CREAM} 100%)`,
        pattern: getPatternDataUrl(TEXTURE_PATTERN),
        patternColor: '#D4A574',
        textColor: TEXT_COLOR,
        cardBackground: 'rgba(255, 255, 255, 0.95)'
    },

    // Default - Warm earth tones with geometric pattern
    'default': {
        gradient: `linear-gradient(135deg, ${WARM_EARTH} 0%, ${SAGE} 100%)`,
        pattern: getPatternDataUrl(GEOMETRIC_PATTERN),
        patternColor: DEEP_CLAY,
        textColor: TEXT_COLOR,
        cardBackground: 'rgba(255, 255, 255, 0.95)'
    }
};

// Helper function to get theme for a category
export const getCategoryTheme = (categoryName) => {
    if (!categoryName) return categoryThemes.default;

    const normalizedName = categoryName.toLowerCase().trim();

    // Check for exact match
    if (categoryThemes[normalizedName]) {
        return categoryThemes[normalizedName];
    }

    // Check for partial matches
    if (normalizedName.includes('oil')) return categoryThemes['cosmetic oils'];
    if (normalizedName.includes('ice cream')) return categoryThemes['ice cream'];
    if (normalizedName.includes('spice')) return categoryThemes['spices'];
    if (normalizedName.includes('cheese') || normalizedName.includes('dairy')) return categoryThemes['dairy'];

    return categoryThemes.default;
};
