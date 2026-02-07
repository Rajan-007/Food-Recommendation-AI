// API configuration and service for menu analyzer

const API_BASE_URL = '/api';
const REQUEST_TIMEOUT = 60000; // 60 seconds for OCR processing

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
}

export interface MenuItem {
  name: string;
  price: number;
  nutrition: Nutrition;
  category: 'recommended' | 'good' | 'not recommended';
  recommendation: string;
}

export interface AnalyzeResponse {
  success: boolean;
  items: MenuItem[];
  error?: string;
  message?: string;
}

export interface AnalyzeRequest {
  image: File;
  userGoal?: string;
  timeOfDay?: string;
  userFoodData?: string[];
}

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isNetworkError: boolean = false
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Create an AbortController with timeout
 */
function createTimeoutController(timeoutMs: number): { controller: AbortController; timeoutId: NodeJS.Timeout } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeoutId };
}

/**
 * Validate response data structure
 */
function validateMenuItem(item: unknown): item is MenuItem {
  if (typeof item !== 'object' || item === null) return false;
  
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.name === 'string' &&
    typeof obj.price === 'number' &&
    typeof obj.nutrition === 'object' &&
    obj.nutrition !== null &&
    typeof obj.category === 'string' &&
    ['recommended', 'good', 'not recommended'].includes(obj.category) &&
    typeof obj.recommendation === 'string'
  );
}

/**
 * Analyze a menu image using the backend API
 */
export async function analyzeMenu(request: AnalyzeRequest): Promise<AnalyzeResponse> {
  const { controller, timeoutId } = createTimeoutController(REQUEST_TIMEOUT);

  try {
    const formData = new FormData();
    formData.append('image', request.image);

    if (request.userGoal) {
      formData.append('userGoal', request.userGoal);
    }

    if (request.timeOfDay) {
      formData.append('timeOfDay', request.timeOfDay);
    }

    if (request.userFoodData && request.userFoodData.length > 0) {
      formData.append('userFoodData', JSON.stringify(request.userFoodData));
    }

    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.error || `Server error: ${response.status}`,
        response.status
      );
    }

    const data = await response.json();

    // Validate response structure
    if (!data || typeof data.success !== 'boolean') {
      throw new APIError('Invalid response format from server');
    }

    // Validate each menu item
    if (data.items && Array.isArray(data.items)) {
      data.items = data.items.filter(validateMenuItem);
    }

    return data as AnalyzeResponse;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof APIError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new APIError('Request timed out. The image may be too large or the server is busy.', undefined, false);
      }
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new APIError('Cannot connect to server. Please check if the backend is running.', undefined, true);
      }

      throw new APIError(error.message);
    }

    throw new APIError('An unexpected error occurred');
  }
}

/**
 * Check backend health
 */
export async function checkHealth(): Promise<{ status: string; version: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Health check failed');
    }

    return response.json();
  } catch {
    throw new APIError('Backend is not available', undefined, true);
  }
}
