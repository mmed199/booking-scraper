const path = require("path")

const config = {
  // Server
  port: parseInt(process.env.PORT, 10) || 3000,

  // Browser
  headless: process.env.HEADLESS !== "false",
  userAgent:
    process.env.USER_AGENT ||
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",

  // Timeouts (in milliseconds)
  navigationTimeout: parseInt(process.env.NAVIGATION_TIMEOUT, 10) || 60000,
  defaultTimeout: parseInt(process.env.DEFAULT_TIMEOUT, 10) || 120000,

  // Directories
  screenshotDir:
    process.env.SCREENSHOT_DIR || path.join(__dirname, "..", "screenshots"),

  // HTTP Headers
  acceptLanguage: process.env.ACCEPT_LANGUAGE || "en-US,en;q=0.9",

  // Browser launch arguments
  browserArgs: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-web-security",
    "--disable-features=IsolateOrigins,site-per-process",
    "--disable-blink-features=AutomationControlled",
    "--window-size=1920,1080",
    "--start-maximized",
  ],
}

module.exports = { config }
