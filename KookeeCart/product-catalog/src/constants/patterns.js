// African-inspired SVG patterns for category backgrounds
// These patterns are culturally authentic and modern

export const ADINKRA_PATTERN = `
<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="adinkra" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
      <!-- Simplified Adinkra-inspired geometric pattern -->
      <circle cx="30" cy="30" r="2" fill="currentColor" opacity="0.15"/>
      <path d="M 15 15 L 45 15 L 30 45 Z" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.1"/>
      <circle cx="15" cy="15" r="3" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.12"/>
      <circle cx="45" cy="15" r="3" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.12"/>
      <circle cx="30" cy="45" r="3" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.12"/>
    </pattern>
  </defs>
  <rect width="60" height="60" fill="url(#adinkra)"/>
</svg>
`;

export const OIL_DROP_PATTERN = `
<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="oil-drops" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <!-- Oil drop shapes -->
      <ellipse cx="10" cy="10" rx="3" ry="4" fill="currentColor" opacity="0.08"/>
      <ellipse cx="30" cy="25" rx="2.5" ry="3.5" fill="currentColor" opacity="0.06"/>
      <ellipse cx="20" cy="35" rx="2" ry="3" fill="currentColor" opacity="0.07"/>
    </pattern>
  </defs>
  <rect width="40" height="40" fill="url(#oil-drops)"/>
</svg>
`;

export const DOT_PATTERN = `
<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <!-- Playful dots for ice cream -->
      <circle cx="5" cy="5" r="1.5" fill="currentColor" opacity="0.12"/>
      <circle cx="15" cy="15" r="1.5" fill="currentColor" opacity="0.12"/>
      <circle cx="10" cy="10" r="1" fill="currentColor" opacity="0.08"/>
    </pattern>
  </defs>
  <rect width="20" height="20" fill="url(#dots)"/>
</svg>
`;

export const TEXTURE_PATTERN = `
<svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="texture" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
      <!-- Subtle texture for dairy -->
      <line x1="0" y1="10" x2="30" y2="10" stroke="currentColor" stroke-width="0.3" opacity="0.05"/>
      <line x1="0" y1="20" x2="30" y2="20" stroke="currentColor" stroke-width="0.3" opacity="0.05"/>
      <circle cx="15" cy="15" r="1" fill="currentColor" opacity="0.04"/>
    </pattern>
  </defs>
  <rect width="30" height="30" fill="url(#texture)"/>
</svg>
`;

export const GEOMETRIC_PATTERN = `
<svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="geometric" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
      <!-- African geometric pattern -->
      <path d="M 0 25 L 25 0 L 50 25 L 25 50 Z" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.08"/>
      <circle cx="25" cy="25" r="3" fill="currentColor" opacity="0.06"/>
      <line x1="25" y1="0" x2="25" y2="50" stroke="currentColor" stroke-width="0.3" opacity="0.05"/>
      <line x1="0" y1="25" x2="50" y2="25" stroke="currentColor" stroke-width="0.3" opacity="0.05"/>
    </pattern>
  </defs>
  <rect width="50" height="50" fill="url(#geometric)"/>
</svg>
`;

// Convert SVG to data URL for use in CSS
export const getPatternDataUrl = (svgString) => {
    return `data:image/svg+xml;base64,${btoa(svgString)}`;
};
