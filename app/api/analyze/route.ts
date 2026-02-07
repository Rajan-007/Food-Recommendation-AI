import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import Groq from 'groq-sdk';
import validator from 'validator';

// ============================================
// Security Configuration
// ============================================

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Magic bytes for image validation
const MAGIC_BYTES: Record<string, number[]> = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
};

// Rate limiting (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

// ============================================
// Validation Helpers
// ============================================

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const magicBytes = MAGIC_BYTES[mimeType];
  if (!magicBytes) return false;

  for (let i = 0; i < magicBytes.length; i++) {
    if (buffer[i] !== magicBytes[i]) return false;
  }
  return true;
}

function sanitizeText(text: unknown): string {
  if (typeof text !== 'string') return '';
  return validator.escape(text.trim());
}

function sanitizeNutrition(nutrition: Record<string, unknown> | null | undefined) {
  return {
    calories: Math.abs(parseInt(String(nutrition?.calories)) || 0),
    protein: Math.abs(parseInt(String(nutrition?.protein)) || 0),
    carbs: Math.abs(parseInt(String(nutrition?.carbs)) || 0),
    fats: Math.abs(parseInt(String(nutrition?.fats)) || 0),
    fiber: Math.abs(parseInt(String(nutrition?.fiber)) || 0),
  };
}

interface RawMenuItem {
  name?: string;
  price?: number | string;
  nutrition?: Record<string, unknown>;
  category?: string;
  recommendation?: string;
}

function sanitizeMenuItem(item: RawMenuItem) {
  const validCategories = ['recommended', 'good', 'not recommended'];
  return {
    name: sanitizeText(item?.name) || 'Unknown Item',
    price: Math.abs(parseFloat(String(item?.price)) || 0),
    nutrition: sanitizeNutrition(item?.nutrition),
    category: validCategories.includes(item?.category || '') ? item.category : 'good',
    recommendation: sanitizeText(item?.recommendation) || '',
  };
}

// ============================================
// AI Processing
// ============================================

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function cleanAndParseWithAI(
  rawText: string,
  userGoal: string = 'maintenance',
  timeOfDay: string = 'any time',
  userFoodData: string[] = []
) {
  try {
    const safeGoal = sanitizeText(userGoal);
    const safeTimeOfDay = sanitizeText(timeOfDay);
    const safeFoodData = Array.isArray(userFoodData)
      ? userFoodData.map((f) => sanitizeText(f)).filter(Boolean)
      : [];

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a menu data extraction expert. Extract menu items and their prices from OCR text that may contain errors and noise.

User Context:
- Goal: ${safeGoal} (weight loss, muscle gain, healthy eating, maintenance)
- Time of day: ${safeTimeOfDay} (breakfast, lunch, dinner, snack, any time)
- Already consumed: ${safeFoodData.join(', ')}

For each menu item, provide:
1. Name and price (cleaned from OCR)
2. Estimated nutrition per serving: calories (kcal), protein (g), carbs (g), fats (g), fiber (g)
3. Category: "recommended", "good", or "not recommended" based on user's goal and what they've eaten
4. Recommendation: Brief reason for the category

Return ONLY a valid JSON object with this EXACT format:
{
  "items": [
    {
      "name": "Item Name",
      "price": 123,
      "nutrition": {
        "calories": 123,
        "protein": 12,
        "carbs": 30,
        "fats": 5,
        "fiber": 3
      },
      "category": "recommended",
      "recommendation": "High protein, low fat - perfect for weight loss"
    }
  ]
}

Rules:
- Remove all OCR noise and gibberish
- Fix common OCR errors
- Extract only food/drink items with prices
- Convert all currency symbols to numbers only
- Return valid JSON only, no markdown or explanation`,
        },
        {
          role: 'user',
          content: `Extract menu items from this OCR text:\n\n${rawText.substring(0, 10000)}`,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(response);

    let items: RawMenuItem[] = [];
    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (parsed.items && Array.isArray(parsed.items)) {
      items = parsed.items;
    } else if (parsed.menu && Array.isArray(parsed.menu)) {
      items = parsed.menu;
    }

    return items.map(sanitizeMenuItem);
  } catch (err) {
    console.error('AI parsing error:', err);
    return [];
  }
}

// ============================================
// API Route Handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Image file is required. Use 'image' as the form field name." },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Get file buffer and validate magic bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: 'Invalid file content. File does not match declared type.' },
        { status: 400 }
      );
    }

    // Parse user preferences
    let userFoodData: string[] = [];
    const rawFoodData = formData.get('userFoodData');
    if (typeof rawFoodData === 'string') {
      try {
        userFoodData = JSON.parse(rawFoodData);
      } catch {
        userFoodData = [rawFoodData];
      }
    }

    const userGoal = (formData.get('userGoal') as string) || 'weight loss';
    const timeOfDay = (formData.get('timeOfDay') as string) || 'lunch';

    console.log(`Processing image: ${file.name} (${file.size} bytes)`);

    // Extract text from image using Tesseract
    let rawText: string;
    try {
      const worker = await createWorker('eng');
      const result = await worker.recognize(buffer);
      rawText = result.data.text;
      await worker.terminate();
    } catch (ocrError) {
      console.error('OCR error:', ocrError);
      return NextResponse.json(
        { error: 'Failed to process the image. Please try again.' },
        { status: 500 }
      );
    }

    if (!rawText || rawText.trim().length < 10) {
      return NextResponse.json(
        { error: 'Could not extract text from image. Please ensure the menu is clear and readable.' },
        { status: 400 }
      );
    }

    // Process with AI
    const menuItems = await cleanAndParseWithAI(rawText, userGoal, timeOfDay, userFoodData);

    if (menuItems.length === 0) {
      return NextResponse.json({
        success: true,
        items: [],
        message: 'No menu items could be identified. Try a clearer image.',
      });
    }

    return NextResponse.json({ success: true, items: menuItems });
  } catch (error) {
    console.error('Error analyzing menu:', error);

    const isProduction = process.env.NODE_ENV === 'production';
    return NextResponse.json(
      {
        error: isProduction
          ? 'An error occurred while processing your request.'
          : error instanceof Error
          ? error.message
          : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST with multipart/form-data.' },
    { status: 405 }
  );
}
