/**
 * ============================================================================
 * Campaign Configuration - FoldFox Laundry
 * ============================================================================
 * 
 * Manage campaigns and discounts from this single file.
 * No code changes needed - just update the values below!
 * 
 * HOW TO USE:
 * -----------
 * 1. To START a campaign: Set isActive = true
 * 2. To END a campaign: Set isActive = false
 * 3. Update campaign details as needed
 * 4. Save file - website updates automatically!
 * 
 * ============================================================================
 */

const campaignConfig = {
  // ============================================
  // 🔥 CAMPAIGN TOGGLE - Turn ON/OFF Here
  // ============================================
  isActive: true, // ⬅️ Set to false to disable campaign
  
  // ============================================
  // 📋 CAMPAIGN DETAILS
  // ============================================
  campaignName: "Grand Opening Special",
  campaignCode: "GRAND_OPENING_2025", // Used in backend for validation
  discount: 20, // Number only (20 means 20% or $20)
  discountType: "percentage", // "percentage" or "fixed"
  
  // ============================================
  // 📅 CAMPAIGN PERIOD
  // ============================================
  // Campaign will only show if current date is within this range
  startDate: "2025-10-13",
  endDate: "2025-12-31",
  
  // ============================================
  // 💬 BUTTON TEXT
  // ============================================
  buttonText: {
    withDiscount: "Register & Get 20% OFF", // Shown when campaign is active
    withoutDiscount: "Register Now" // Shown when no campaign
  },
  
  // ============================================
  // ✅ SUCCESS MESSAGE
  // ============================================
  // Shown after successful registration (campaign active only)
  successMessage: "Congratulations! You've secured your 20% discount on your first order! 🎉",
  
  // ============================================
  // 📢 ANNOUNCEMENT BANNER
  // ============================================
  // Shown at top of Hero section when campaign is active
  announcement: {
    show: true, // Set to false to hide banner even when campaign is active
    text: "Limited Time Offer - Get 20% OFF on your first order!"
  },
  
  // ============================================
  // 🏷️ NAVBAR BADGE
  // ============================================
  // Small badge shown under logo in navigation bar
  navbarBadge: {
    show: true, // Set to false to hide navbar badge
    text: "Limited Offer" // Text shown after discount amount
  }
};

// ============================================================================
// HELPER FUNCTIONS (Do not modify below this line)
// ============================================================================

/**
 * Check if campaign is currently active
 * Returns true only if:
 * 1. isActive is true
 * 2. Current date is within start/end date range
 */
export const isCampaignActive = () => {
  if (!campaignConfig.isActive) return false;
  
  // Check date range
  const now = new Date();
  const start = new Date(campaignConfig.startDate);
  const end = new Date(campaignConfig.endDate);
  
  return now >= start && now <= end;
};

/**
 * Get formatted discount text for display
 * Returns: "20% OFF" or "$20 OFF" depending on type
 */
export const getDiscountText = () => {
  if (!isCampaignActive()) return null;
  
  if (campaignConfig.discountType === "percentage") {
    return `${campaignConfig.discount}% OFF`;
  } else {
    return `$${campaignConfig.discount} OFF`;
  }
};

/**
 * Get appropriate button text based on campaign status
 * Returns campaign button text if active, otherwise regular text
 */
export const getButtonText = () => {
  return isCampaignActive() 
    ? campaignConfig.buttonText.withDiscount 
    : campaignConfig.buttonText.withoutDiscount;
};

/**
 * Check if announcement banner should be shown
 * Returns true only if campaign is active AND announcement.show is true
 */
export const shouldShowAnnouncement = () => {
  return isCampaignActive() && campaignConfig.announcement.show;
};

/**
 * Get announcement banner data
 * Returns announcement object if should be shown, null otherwise
 */
export const getAnnouncement = () => {
  return shouldShowAnnouncement() ? campaignConfig.announcement : null;
};

/**
 * Check if navbar badge should be shown
 * Returns true only if campaign is active AND navbarBadge.show is true
 */
export const shouldShowNavbarBadge = () => {
  return isCampaignActive() && campaignConfig.navbarBadge.show;
};

/**
 * Get navbar badge text
 * Returns badge text if should be shown, null otherwise
 */
export const getNavbarBadgeText = () => {
  return shouldShowNavbarBadge() ? campaignConfig.navbarBadge.text : null;
};

export default campaignConfig;
