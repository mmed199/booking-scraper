const puppeteer = require("puppeteer")
const { config } = require("./config")
const { createDiagnostics, autoScroll, delay } = require("./utils")
const { extractHotelData } = require("./extractors")

/**
 * Configures page to avoid bot detection
 * @param {import('puppeteer').Page} page
 */
async function setupAntiDetection(page) {
  await page.evaluateOnNewDocument(() => {
    // Hide webdriver property
    Object.defineProperty(navigator, "webdriver", { get: () => undefined })

    // Mock Chrome object
    window.chrome = {
      runtime: {},
      loadTimes: function () {},
      csi: function () {},
      app: {},
    }

    // Mock plugins
    Object.defineProperty(navigator, "plugins", {
      get: () => [
        {
          0: {
            type: "application/x-google-chrome-pdf",
            suffixes: "pdf",
            description: "Portable Document Format",
          },
          name: "Chrome PDF Plugin",
          filename: "internal-pdf-viewer",
          length: 1,
        },
        {
          0: {
            type: "application/pdf",
            suffixes: "pdf",
            description: "Portable Document Format",
          },
          name: "Chrome PDF Viewer",
          filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
          length: 1,
        },
      ],
    })

    // Mock languages
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en", "fr-FR", "fr"],
    })

    // Clean user agent
    const userAgent = navigator.userAgent
    Object.defineProperty(navigator, "userAgent", {
      get: () => userAgent.replace("Headless", ""),
    })
  })
}

/**
 * Clicks on tabs to load dynamic content
 * @param {import('puppeteer').Page} page
 * @param {Function} logStep
 */
async function loadDynamicContent(page, logStep) {
  const tabs = [
    { selector: 'a[href="#rooms"]', name: "Rooms" },
    { selector: 'a[href="#facilities"]', name: "Facilities" },
    { selector: 'a[href="#reviews"]', name: "Reviews" },
  ]

  for (const tab of tabs) {
    try {
      await page.waitForSelector(tab.selector, { timeout: 3000 })
      await page.click(tab.selector)
      await delay(500)
    } catch (err) {
      logStep(`Could not click ${tab.name} tab`, { error: err.message })
    }
  }
}

/**
 * Main scraping function
 * @param {string} url - Booking.com hotel URL
 * @returns {Promise<object>}
 */
async function scrapeHotelData(url) {
  const sessionId = Date.now().toString()
  const { diagnostics, addStep } = createDiagnostics(sessionId)
  const galleryImages = []

  let browser = null

  try {
    addStep("Initialization", { url })

    // Launch browser
    browser = await puppeteer.launch({
      headless: config.headless,
      args: config.browserArgs,
      ignoreHTTPSErrors: true,
    })

    addStep("Browser launched")

    const page = await browser.newPage()

    // Setup anti-detection
    await setupAntiDetection(page)

    // Configure page
    await page.setViewport({ width: 1920, height: 1080 })
    await page.setUserAgent(config.userAgent)
    await page.setExtraHTTPHeaders({
      "Accept-Language": config.acceptLanguage,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Cache-Control": "max-age=0",
    })

    // Set timeouts
    page.setDefaultNavigationTimeout(config.navigationTimeout)
    page.setDefaultTimeout(config.defaultTimeout)

    // Intercept requests to save bandwidth and collect images
    await page.setRequestInterception(true)
    page.on("request", (req) => {
      const resourceType = req.resourceType()
      const requestUrl = req.url()

      // Block unnecessary resources
      if (
        resourceType === "font" ||
        requestUrl.includes("analytics") ||
        requestUrl.includes("tracking") ||
        requestUrl.includes("telemetry")
      ) {
        req.abort()
        return
      }

      // Collect gallery images
      if (
        resourceType === "image" &&
        requestUrl.includes("https://cf.bstatic.com/xdata/images/hotel/max300")
      ) {
        galleryImages.push(requestUrl.replace("max300", "max1024x768"))
      }

      req.continue()
    })

    // Handle dialogs
    page.on("dialog", async (dialog) => {
      addStep("Dialog detected", {
        type: dialog.type(),
        message: dialog.message(),
      })
      await dialog.dismiss()
    })

    // Track redirects
    page.on("response", async (response) => {
      const status = response.status()
      if (status >= 300 && status <= 399) {
        addStep("Redirect detected", {
          from: response.request().url(),
          to: response.headers()["location"] || "Unknown",
          status,
        })
      }
    })

    // Navigate to URL
    addStep("Navigating to URL", { url })
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: config.navigationTimeout,
    })

    if (!response) {
      throw new Error("No response from server")
    }

    const status = response.status()
    addStep("Response received", { status, url: page.url() })

    // Wait for critical content to be present
    await page
      .waitForSelector(
        'h2.d2fee87262, [data-testid="title"], #hp_hotel_name',
        {
          timeout: 10000,
        },
      )
      .catch(() => {
        addStep("Warning: Could not find hotel title selector, continuing anyway")
      })

    // Check HTTP status
    if (status !== 200) {
      if (status === 403) {
        throw new Error("Access denied (403) - Bot detection likely triggered")
      }
      if (status === 404) {
        throw new Error("Page not found (404)")
      }
    }

    // Check for captcha or redirect
    const currentUrl = page.url()
    if (
      currentUrl.includes("captcha") ||
      !currentUrl.includes("booking.com/hotel")
    ) {
      addStep("Redirect or captcha detected", { originalUrl: url, currentUrl })

      await delay(5000)

      if (currentUrl.includes("captcha")) {
        addStep("Captcha detected - waiting for resolution")
        try {
          await page.waitForNavigation({ timeout: 30000 })
          addStep("Navigation after captcha", { url: page.url() })
        } catch {
          addStep("Timeout waiting for captcha resolution")
        }
      }
    }

    // Verify final URL
    const finalUrl = page.url()
    addStep("Final URL", { url: finalUrl })

    if (!finalUrl.includes("booking.com/hotel")) {
      throw new Error(`Final URL is not a hotel page: ${finalUrl}`)
    }

    // Wait for content and scroll
    addStep("Waiting for content to load")
    await page.waitForSelector("body", { timeout: 30000 })

    addStep("Scrolling page")
    await autoScroll(page)

    // Load dynamic content
    await loadDynamicContent(page, addStep)

    // Extract data
    addStep("Extracting data")
    const hotelData = await extractHotelData(page, addStep)
    hotelData.galleryImages = [...new Set(galleryImages)]

    addStep("Extraction complete", {
      dataFields: Object.keys(hotelData),
      hasRooms: hotelData.rooms?.length > 0,
      hasReviews: hotelData.reviews?.length > 0,
    })

    return {
      success: true,
      data: hotelData,
      diagnostics,
    }
  } catch (error) {
    addStep("Error", { message: error.message, stack: error.stack })

    return {
      success: false,
      error: error.message,
      diagnostics,
    }
  } finally {
    if (browser) {
      addStep("Closing browser")
      await browser.close()
    }
  }
}

module.exports = { scrapeHotelData }
