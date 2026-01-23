const { app } = require("./server")

const TEST_PORT = 3001
const TEST_HOTEL_URL =
  "https://www.booking.com/hotel/ma/riad-verus.en-gb.html"

describe("Booking Scraper Server", () => {
  let server

  beforeAll((done) => {
    server = app.listen(TEST_PORT, done)
  }, 10000)

  afterAll((done) => {
    server.close(done)
  })

  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await fetch(`http://localhost:${TEST_PORT}/health`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe("ok")
      expect(data.timestamp).toBeDefined()
    })
  })

  describe("POST /scrape", () => {
    it("should reject invalid URLs", async () => {
      const response = await fetch(`http://localhost:${TEST_PORT}/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "https://example.com" }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain("Invalid URL")
    })

    it(
      "should scrape a valid hotel page",
      async () => {
        const response = await fetch(`http://localhost:${TEST_PORT}/scrape`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: TEST_HOTEL_URL }),
        })

        expect(response.status).toBe(200)
        const data = await response.json()

        // Validate expected structure
        expect(data.hotelName).toBeDefined()
        expect(typeof data.hotelName).toBe("string")
        expect(data.hotelName.length).toBeGreaterThan(0)

        expect(data.address).toBeDefined()
        expect(data.description).toBeDefined()

        expect(data.rating).toBeDefined()
        expect(data.rating.score).toBeDefined()

        expect(data.galleryImages).toBeDefined()
        expect(Array.isArray(data.galleryImages)).toBe(true)

        expect(data.features).toBeDefined()
        expect(Array.isArray(data.features)).toBe(true)

        expect(data.rooms).toBeDefined()
        expect(Array.isArray(data.rooms)).toBe(true)

        // Validate room structure if rooms exist
        if (data.rooms.length > 0) {
          const firstRoom = data.rooms[0]
          expect(firstRoom.name).toBeDefined()
          expect(firstRoom.maxOccupancy).toBeDefined()
        }

        console.log(`✓ Successfully scraped: ${data.hotelName}`)
        console.log(`  - ${data.galleryImages.length} gallery images`)
        console.log(`  - ${data.features.length} features`)
        console.log(`  - ${data.rooms.length} rooms`)
      },
      120000 // 2 minute timeout for scraping
    )
  })
})
