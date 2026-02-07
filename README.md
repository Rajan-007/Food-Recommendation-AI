# Menu Analyzer

AI-powered restaurant menu analyzer that extracts food items from menu images and provides personalized nutrition-based recommendations.

## Features

- 📸 **OCR Menu Scanning** - Upload menu images for automatic text extraction
- 🤖 **AI-Powered Analysis** - Uses Groq LLM for intelligent menu parsing and recommendations
- 🎯 **Personalized Goals** - Recommendations based on weight loss, muscle gain, or health goals
- 🔒 **Security** - Rate limiting, input validation, and security headers

## Quick Start

### Prerequisites

- Node.js 18+
- Groq API key ([Get one here](https://console.groq.com/keys))

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Add your GROQ_API_KEY to .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/menu-analyzer)

1. Click deploy button or import from GitHub
2. Add `GROQ_API_KEY` in Vercel Environment Variables
3. Deploy!

## Environment Variables

| Variable           | Required | Description                           |
| ------------------ | -------- | ------------------------------------- |
| `GROQ_API_KEY`     | ✅       | API key for Groq AI                   |
| `RATE_LIMIT_MAX`   | ❌       | Max requests per 15min (default: 100) |
| `MAX_FILE_SIZE_MB` | ❌       | Max upload size in MB (default: 5)    |

## API Reference

### POST /api/analyze

Analyze a menu image.

**Request:** `multipart/form-data`

- `image` (required) - Menu image (JPEG, PNG, WebP, GIF, max 5MB)
- `userGoal` - Goal: `weight loss`, `muscle gain`, `maintenance`, `healthy eating`
- `timeOfDay` - `breakfast`, `lunch`, `dinner`, `snack`
- `userFoodData` - JSON array of already consumed foods

**Response:**

```json
{
  "success": true,
  "items": [
    {
      "name": "Grilled Chicken Salad",
      "price": 12.99,
      "nutrition": {
        "calories": 350,
        "protein": 35,
        "carbs": 15,
        "fats": 12,
        "fiber": 5
      },
      "category": "recommended",
      "recommendation": "High protein, low carb - great for weight loss"
    }
  ],
  "requestId": "uuid-for-tracing"
}
```

### GET /api/health

Health check endpoint.

## Tech Stack

- **Framework:** Next.js 16
- **OCR:** Tesseract.js
- **AI:** Groq (Llama 3.3 70B)
- **Styling:** Tailwind CSS

## License

MIT
