/**
 * Extracts hotel name from the page
 * @param {import('puppeteer').Page} page
 * @returns {Promise<string|null>}
 */
async function extractHotelName(page) {
  return page.evaluate(() => {
    const selectors = [
      "h2.d2fee87262",
      ".pp-header__title",
      "#hp_hotel_name",
      '[data-testid="title"]',
      "h1.pp-header__title",
      ".hp__hotel-title",
      ".hp__hotel-name",
    ]

    for (const selector of selectors) {
      const element = document.querySelector(selector)
      if (element && element.textContent.trim()) {
        return element.textContent.trim()
      }
    }

    // Fallback: first meaningful h2
    const h2 = document.querySelector("h2")
    return h2?.textContent.trim() || null
  })
}

/**
 * Extracts hotel address from the page
 * @param {import('puppeteer').Page} page
 * @returns {Promise<string|null>}
 */
async function extractAddress(page) {
  return page.evaluate(() => {
    // Look for address containing country name patterns
    const addressDiv = Array.from(document.querySelectorAll("button div")).find(
      (div) => {
        const text = div.textContent
        return (
          text.includes("Morocco") ||
          text.includes("France") ||
          text.includes("Spain") ||
          text.includes("Italy") ||
          text.includes("Germany") ||
          text.includes("United") ||
          text.includes("Maroc") ||
          /\d{5}/.test(text) // Postal code pattern
        )
      },
    )

    return addressDiv?.childNodes[0]?.textContent.trim() || null
  })
}

/**
 * Extracts hotel description from the page
 * @param {import('puppeteer').Page} page
 * @returns {Promise<string>}
 */
async function extractDescription(page) {
  return page.evaluate(() => {
    const selectors = [
      "#property_description_content",
      ".hotel_description_wrapper_exp",
      '[data-testid="property-description"]',
      ".hp-description",
      ".hotel-description",
      "#summary",
    ]

    for (const selector of selectors) {
      const element = document.querySelector(selector)
      if (element && element.textContent.trim()) {
        return element.textContent.trim()
      }
    }

    return ""
  })
}

/**
 * Extracts rating and review count from the page
 * @param {import('puppeteer').Page} page
 * @returns {Promise<{score: string|null, totalReviews: number|null}>}
 */
async function extractRating(page) {
  return page.evaluate(() => {
    try {
      const scoreContainer = document.querySelector(
        '[data-testid="review-score-right-component"]',
      )
      if (!scoreContainer) {
        return { score: null, totalReviews: null }
      }

      const elements = Array.from(
        scoreContainer.querySelectorAll('div[aria-hidden="true"]'),
      ).map((div) => div.textContent.trim().replace(",", "."))

      const text = elements[1] || ""
      const match = text.match(/[\d\s]+/)

      return {
        score: elements[0] || null,
        totalReviews: match ? parseInt(match[0].replace(/\s/g, ""), 10) : null,
      }
    } catch {
      return { score: null, totalReviews: null }
    }
  })
}

/**
 * Extracts hotel features/amenities from the page
 * @param {import('puppeteer').Page} page
 * @returns {Promise<string[]>}
 */
async function extractFeatures(page) {
  return page.evaluate(() => {
    return Array.from(
      document.querySelectorAll(
        '[data-testid="property-most-popular-facilities-wrapper"] li span span',
      ),
    ).map((span) => span.textContent.trim())
  })
}

/**
 * Extracts room information from the page
 * @param {import('puppeteer').Page} page
 * @returns {Promise<Array>}
 */
async function extractRooms(page) {
  return page.evaluate(async () => {
    const delay = (ms) => new Promise((res) => setTimeout(res, ms))
    const roomRows = document.querySelectorAll(".roomstable tr")
    const results = []

    for (const row of roomRows) {
      const nameEl = row.querySelector("a span")
      const occupancyEl = row.querySelector("td:nth-child(2) [aria-label]")

      if (!nameEl || !occupancyEl) continue

      const name = nameEl.textContent.trim()
      const occupancyText = occupancyEl.getAttribute("aria-label") || ""
      const occupancyMatch = occupancyText.match(/(\d+)\s+adult/i)
      const maxOccupancy = occupancyMatch
        ? parseInt(occupancyMatch[1], 10)
        : null

      // Click to open popup
      nameEl.click()
      await delay(1000)

      const popup = document.querySelector('[data-testid="rp-content"]')
      if (!popup) continue

      const description =
        popup
          .querySelector('[data-testid="rp-description"]')
          ?.textContent.trim() || ""
      const size =
        popup
          .querySelector('[data-testid="rp-room-size"] span.b99b6ef58f span')
          ?.textContent.trim() || ""
      const amenities = Array.from(
        popup.querySelectorAll(
          '[data-testid="property-unit-facility-badge-icon"] span.beb5ef4fb4',
        ),
      ).map((span) => span.textContent.trim())

      const images = Array.from(
        new Set(
          Array.from(
            popup.querySelectorAll(
              '[data-testid="roomPagePhotos"] div[style*="background-image"]',
            ),
          )
            .map((div) => {
              const match = div.style.backgroundImage.match(/url\("(.+?)"\)/)
              return match ? match[1] : null
            })
            .filter(Boolean)
            .map((url) => url.replace(/max300/, "max1024x768")),
        ),
      )

      results.push({
        name,
        maxOccupancy,
        description,
        images,
        size,
        amenities,
      })

      // Close popup
      document.querySelector('[aria-label="Close banner"]')?.click()
      await delay(500)
    }

    return results
  })
}

/**
 * Extracts guest reviews from the page
 * @param {import('puppeteer').Page} page
 * @returns {Promise<Array>}
 */
async function extractReviews(page) {
  return page.evaluate(() => {
    return Array.from(
      document.querySelectorAll('[data-testid="featuredreview"]'),
    ).map((review) => {
      const name =
        review
          .querySelector('[data-testid="featuredreview-avatar"] .b08850ce41')
          ?.textContent.trim() || ""
      const country =
        review
          .querySelector('[data-testid="featuredreview-avatar"] .d838fb5f41')
          ?.textContent.trim() || ""
      const text =
        review
          .querySelector('[data-testid="featuredreview-text"] .b99b6ef58f')
          ?.textContent.trim()
          .replace(/^«\s*|\s*»$/g, "") || ""

      return { name, country, text }
    })
  })
}

/**
 * Extracts check-in and check-out times from the page
 * @param {import('puppeteer').Page} page
 * @returns {Promise<{checkin: string, checkout: string}>}
 */
async function extractCheckTimes(page) {
  return page.evaluate(() => {
    const timeTexts = Array.from(document.querySelectorAll("body *"))
      .map((el) => el.textContent.trim())
      .filter(
        (text) =>
          /^From\s\d{2}:\d{2}\sto\s\d{2}:\d{2}$/i.test(text) ||
          /^Until\s\d{2}:\d{2}$/i.test(text) ||
          /^De\s\d{2}:\d{2}\sà\s\d{2}:\d{2}$/.test(text) ||
          /^Jusqu'à\s\d{2}:\d{2}$/.test(text),
      )

    return {
      checkin: timeTexts[0] || null,
      checkout: timeTexts[1] || null,
    }
  })
}

/**
 * Extracts nearby places from the page
 * @param {import('puppeteer').Page} page
 * @returns {Promise<Array>}
 */
async function extractNearbyPlaces(page) {
  return page.evaluate(() => {
    const poiBlocks = document.querySelectorAll('[data-testid="poi-block"]')

    return Array.from(poiBlocks).flatMap((block) => {
      const type =
        block.querySelector("h3 div")?.textContent.trim().toLowerCase() || ""
      const items = block.querySelectorAll('[data-testid="poi-block-list"] li')

      return Array.from(items).map((item) => {
        const nameEl = item.querySelector("div.aa225776f2")
        const distanceEl = item.querySelector("div.b99b6ef58f")

        let place = nameEl?.textContent.trim() || ""
        const distance = distanceEl?.textContent.trim() || ""

        // Remove type prefix from place name
        place = place.replace(/^(Restaurant|Train|Airport)\s*/i, "")

        return { place, distance, type }
      })
    })
  })
}

/**
 * Extracts all hotel data from the page
 * @param {import('puppeteer').Page} page
 * @param {Function} logStep - Diagnostic logging function
 * @returns {Promise<object>}
 */
async function extractHotelData(page, logStep) {
  const hotelData = {
    hotelName: "",
    address: "",
    description: "",
    rating: { score: null, totalReviews: null },
    galleryImages: [],
    features: [],
    rooms: [],
    reviews: [],
    checkin: "",
    checkout: "",
    nearbyPlaces: [],
  }

  try {
    logStep("Extracting hotel name")
    hotelData.hotelName = await extractHotelName(page)
    logStep("Hotel name extracted", { name: hotelData.hotelName })

    logStep("Extracting address")
    hotelData.address = await extractAddress(page)
    logStep("Address extracted", { address: hotelData.address })

    logStep("Extracting description")
    hotelData.description = await extractDescription(page)
    logStep("Description extracted", { length: hotelData.description.length })

    logStep("Extracting rating")
    hotelData.rating = await extractRating(page)
    logStep("Rating extracted", { rating: hotelData.rating })

    logStep("Extracting features")
    hotelData.features = await extractFeatures(page)
    logStep("Features extracted", { count: hotelData.features.length })

    logStep("Extracting rooms")
    hotelData.rooms = await extractRooms(page)
    logStep("Rooms extracted", { count: hotelData.rooms.length })

    logStep("Extracting reviews")
    hotelData.reviews = await extractReviews(page)
    logStep("Reviews extracted", { count: hotelData.reviews.length })

    logStep("Extracting check times")
    const checkTimes = await extractCheckTimes(page)
    hotelData.checkin = checkTimes.checkin
    hotelData.checkout = checkTimes.checkout
    logStep("Check times extracted", checkTimes)

    logStep("Extracting nearby places")
    hotelData.nearbyPlaces = await extractNearbyPlaces(page)
    logStep("Nearby places extracted", { count: hotelData.nearbyPlaces.length })

    return hotelData
  } catch (error) {
    logStep("Error during extraction", { message: error.message })
    throw error
  }
}

module.exports = {
  extractHotelName,
  extractAddress,
  extractDescription,
  extractRating,
  extractFeatures,
  extractRooms,
  extractReviews,
  extractCheckTimes,
  extractNearbyPlaces,
  extractHotelData,
}
