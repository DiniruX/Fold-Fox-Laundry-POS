/**
 * Built-in clothing categories. These are always available and cannot be deleted.
 * Admins can add more through the ClothingCategory collection.
 */
const FIXED_CLOTHING_CATEGORIES = [
  { key: 'normal_clothes', label: 'Normal Clothes' },
  { key: 'bed_sheets', label: 'Bed Sheets' },
  { key: 'towels', label: 'Towels' },
  { key: 'blazers', label: 'Blazers' },
  { key: 'saree', label: 'Saree' },
  { key: 'curtains', label: 'Curtains' },
  { key: 'pillowcases', label: 'Pillowcases' },
  { key: 'suits', label: 'Suits' },
  { key: 'jeans', label: 'Jeans' },
  { key: 'blankets', label: 'Blankets' },
  { key: 'other', label: 'Other' },
];

const FIXED_CATEGORY_KEYS = FIXED_CLOTHING_CATEGORIES.map(c => c.key);

// Category keys are used as Map keys on Service, so keep them to [a-z0-9_]
const CATEGORY_KEY_PATTERN = /^[a-z0-9_]+$/;

// "T-Shirts & Tops" -> "t_shirts_tops"
const toCategoryKey = (label) =>
  String(label || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

module.exports = {
  FIXED_CLOTHING_CATEGORIES,
  FIXED_CATEGORY_KEYS,
  CATEGORY_KEY_PATTERN,
  toCategoryKey,
};
