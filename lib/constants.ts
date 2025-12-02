// Pagination
export const ITEMS_PER_PAGE_DESKTOP = 10
export const ITEMS_PER_PAGE_MOBILE = 3
export const MILESTONES_PER_PAGE_DESKTOP = 3
export const MILESTONES_PER_PAGE_MOBILE = 1

// Date formats
export const DATE_FORMAT_SHORT = {
  month: "short" as const,
  day: "numeric" as const,
  year: "numeric" as const,
}

export const DATE_FORMAT_LONG = {
  year: "numeric" as const,
  month: "long" as const,
  day: "numeric" as const,
}

// Status values
export const PROJECT_STATUSES = ["active", "completed", "on-hold", "planning", "review"] as const
export const MILESTONE_STATUSES = ["pending", "in-progress", "completed", "overdue", "not-started"] as const

// Progress thresholds
export const AT_RISK_THRESHOLD = 30
export const LOW_PROGRESS_THRESHOLD = 50

// Currency formatting
export const CURRENCY_LOCALE = "en-US"
export const CURRENCY_CODE = "CKB"

// UI Colors
export const UI_COLORS = {
  primary: "#10c0dd",
  primaryHover: "#0ea5e9",
  success: "#4CAF50",
  warning: "#FFC107",
  error: "#F44336",
  info: "#2196F3",
} as const

// UI Spacing
export const UI_SPACING = {
  xs: "4px",
  s: "8px",
  m: "12px",
  l: "16px",
  xl: "20px",
  "2xl": "24px",
  "3xl": "32px",
} as const

// UI Border Radius
export const UI_BORDER_RADIUS = {
  xs: "4px",
  s: "8px",
  m: "12px",
  l: "16px",
  xl: "20px",
} as const

// UI Typography
export const UI_TYPOGRAPHY = {
  fontFamily: "var(--font-sf-rounded)",
  letterSpacingTitle: "0.0025em",
  letterSpacingBody: "0.0015em",
  lineHeightTitle: "145%",
  lineHeightBody: "150%",
} as const
