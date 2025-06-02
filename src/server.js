const express = require("express")
const { config } = require("./config")
const { ensureDirectory, isValidBookingUrl } = require("./utils")
const { scrapeHotelData } = require("./scraper")

const app = express()

// Middleware
app.use(express.json())

// Create screenshots directory on startup
ensureDirectory(config.screenshotDir)

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

// Main scraping endpoint
app.post("/scrape", async (req, res) => {
  try {
    const { url } = req.body

    // Validate URL
    if (!isValidBookingUrl(url)) {
      return res.status(400).json({
        error:
          "Invalid URL. Please provide a valid Booking.com hotel profile URL.",
        example: "https://www.booking.com/hotel/xx/hotel-name.html",
      })
    }

    console.log(`Starting scrape for: ${url}`)

    // Run scraper
    const result = await scrapeHotelData(url)

    if (result.success) {
      res.json(result.data)
    } else {
      res.status(500).json({
        error: "Scraping failed",
        details: result.error,
        diagnostics: result.diagnostics,
      })
    }
  } catch (error) {
    console.error("Scraping error:", error)
    res.status(500).json({
      error: "An error occurred during scraping",
      details: error.message,
    })
  }
})

/**
 * Starts the Express server
 * @returns {import('http').Server}
 */
function startServer() {
  return app.listen(config.port, () => {
    console.log(`Server started on http://localhost:${config.port}`)
    console.log(`Health check: http://localhost:${config.port}/health`)
  })
}

module.exports = { app, startServer }
