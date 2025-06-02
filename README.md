# Booking.com Hotel Scraper

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A high-performance web scraper that extracts structured data from Booking.com hotel profile pages. Built with Express and Puppeteer, featuring anti-detection measures and comprehensive data extraction.

## Features

- 🏨 **Comprehensive Data Extraction** - Hotel name, address, description, rating, reviews, rooms, amenities, and more
- 🖼️ **Image Collection** - Automatically collects high-resolution gallery images
- 🛡️ **Anti-Detection** - Built-in measures to avoid bot detection
- ⚡ **REST API** - Simple POST endpoint for easy integration
- 🔧 **Configurable** - Environment-based configuration for all settings
- 📊 **Diagnostics** - Detailed logging and error reporting

## Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/booking-scraper.git
cd booking-scraper

# Install dependencies
npm install

# Copy environment template (optional)
cp .env.example .env
```

### Running the Server

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

The server will start on `http://localhost:3000` by default.

## API Reference

### POST /scrape

Scrapes hotel data from a Booking.com hotel page.

**Request:**

```bash
curl -X POST http://localhost:3000/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.booking.com/hotel/xx/hotel-name.html"}'
```

**Response:**

```json
{
  "hotelName": "Hotel Name",
  "address": "123 Street, City, Country",
  "description": "Hotel description...",
  "rating": {
    "score": "9.2",
    "totalReviews": 1234
  },
  "galleryImages": ["https://..."],
  "features": ["Free WiFi", "Pool", "..."],
  "rooms": [
    {
      "name": "Standard Room",
      "maxOccupancy": 2,
      "description": "Room description...",
      "images": ["https://..."],
      "size": "25 m²",
      "amenities": ["Air conditioning", "..."]
    }
  ],
  "reviews": [
    {
      "name": "John",
      "country": "United States",
      "text": "Great hotel!"
    }
  ],
  "checkin": "From 14:00 to 22:00",
  "checkout": "Until 12:00",
  "nearbyPlaces": [
    {
      "place": "Train Station",
      "distance": "500 m",
      "type": "transport"
    }
  ]
}
```

### GET /health

Health check endpoint.

```bash
curl http://localhost:3000/health
```

## Configuration

All configuration is done via environment variables. Copy `.env.example` to `.env` to customize:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `HEADLESS` | `true` | Run browser in headless mode |
| `USER_AGENT` | Chrome 120 | Browser user agent string |
| `NAVIGATION_TIMEOUT` | `60000` | Page navigation timeout (ms) |
| `DEFAULT_TIMEOUT` | `120000` | General timeout (ms) |
| `SCREENSHOT_DIR` | `./screenshots` | Debug screenshot directory |
| `ACCEPT_LANGUAGE` | `en-US,en;q=0.9` | Accept-Language header |

## Project Structure

```
booking-scraper/
├── src/
│   ├── config.js      # Environment-based configuration
│   ├── extractors.js  # Data extraction functions
│   ├── scraper.js     # Browser automation logic
│   ├── server.js      # Express app and routes
│   └── utils.js       # Helper functions
├── index.js           # Entry point
├── package.json
├── .env.example
└── README.md
```

## Development

```bash
# Run linter
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Run all checks
npm run check
```

## Limitations

1. **Bot Detection** - Booking.com has sophisticated anti-bot measures. The scraper may be blocked during high-frequency usage.

2. **Dynamic Selectors** - Booking.com frequently updates their HTML structure. Selectors may need updates.

3. **Rate Limiting** - Implement appropriate delays between requests to avoid being blocked.

## Legal Disclaimer

This tool is provided for educational and research purposes only. Web scraping may violate Booking.com's Terms of Service. Users are responsible for ensuring their use complies with applicable laws and terms of service. The authors are not responsible for any misuse of this software.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
