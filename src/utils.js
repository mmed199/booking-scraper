const fs = require("fs").promises

/**
 * Creates a diagnostic logger for tracking scraping steps
 * @param {string} sessionId - Unique session identifier
 * @returns {object} Diagnostics object with logging function
 */
function createDiagnostics(sessionId) {
  const diagnostics = {
    sessionId,
    steps: [],
    screenshots: [],
  }

  const addStep = (step, details = {}) => {
    diagnostics.steps.push({
      timestamp: new Date().toISOString(),
      step,
      ...details,
    })
    console.log(`[${sessionId}] ${step}:`, details)
  }

  return { diagnostics, addStep }
}

/**
 * Auto-scrolls the page to trigger lazy-loaded content
 * @param {import('puppeteer').Page} page - Puppeteer page instance
 */
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0
      const distance = 100
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight
        window.scrollBy(0, distance)
        totalHeight += distance

        if (totalHeight >= scrollHeight) {
          clearInterval(timer)
          resolve()
        }
      }, 100)
    })
  })

  // Scroll back to top
  await page.evaluate(() => {
    window.scrollTo(0, 0)
  })
}

/**
 * Ensures a directory exists, creating it if necessary
 * @param {string} dirPath - Path to the directory
 */
async function ensureDirectory(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true })
  } catch (err) {
    console.error(`Error creating directory ${dirPath}:`, err)
  }
}

/**
 * Validates that a URL is a Booking.com hotel page
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
function isValidBookingUrl(url) {
  return url && url.includes("booking.com/hotel")
}

/**
 * Delays execution for a specified time
 * @param {number} ms - Milliseconds to wait
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

module.exports = {
  createDiagnostics,
  autoScroll,
  ensureDirectory,
  isValidBookingUrl,
  delay,
}
