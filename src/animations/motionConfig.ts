/**
 * Common Viewport trigger configuration.
 * Triggers animation smoothly as soon as the element enters the viewport.
 * Uses a safe amount (0.05) and minimal bottom margin so tall vertical lists
 * on mobile screens trigger immediately without lag or remaining hidden.
 */
export const defaultViewport = {
  once: true,
  amount: 0.05,
  margin: '0px 0px -10px 0px',
};

export const headerViewport = {
  once: true,
  amount: 0.1,
  margin: '0px 0px -10px 0px',
};
