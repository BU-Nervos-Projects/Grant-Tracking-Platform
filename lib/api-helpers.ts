import { NextResponse } from "next/server"
import type { ApiResponse } from "./types"

// Standard error responses
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export function validateEnvironmentVariables(requiredVars: string[]): void {
  const missing = requiredVars.filter((varName) => !process.env[varName])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }
}

// Error handler wrapper for API routes
export function handleApiError(error: unknown): NextResponse {
  if (process.env.NODE_ENV === "development") {
    console.error("[API Error]:", error)
  }

  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message } as ApiResponse<never>, { status: error.statusCode })
  }

  if (error instanceof Error) {
    // Database errors
    if (error.message.includes("duplicate key")) {
      return NextResponse.json({ error: "A record with this information already exists" } as ApiResponse<never>, {
        status: 409,
      })
    }

    if (error.message.includes("foreign key")) {
      return NextResponse.json({ error: "Referenced record does not exist" } as ApiResponse<never>, { status: 400 })
    }

    const message = process.env.NODE_ENV === "development" ? error.message : "An error occurred"
    return NextResponse.json({ error: message } as ApiResponse<never>, { status: 500 })
  }

  // Unknown error
  return NextResponse.json({ error: "An unexpected error occurred" } as ApiResponse<never>, { status: 500 })
}

// Input validation helpers
export function validateRequired(fields: Record<string, any>): void {
  const missing = Object.entries(fields)
    .filter(([_, value]) => value === undefined || value === null || value === "")
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new ApiError(400, `Missing required fields: ${missing.join(", ")}`)
  }
}

export function validateStringLength(value: string | null | undefined, fieldName: string, maxLength: number): void {
  if (value && typeof value === "string" && value.length > maxLength) {
    throw new ApiError(
      400,
      `Field '${fieldName}' exceeds maximum length of ${maxLength} characters (${value.length} provided)`,
    )
  }
}

export function validateNumber(value: any, fieldName: string, options?: { min?: number; max?: number }): number {
  const num = typeof value === "string" ? Number.parseFloat(value) : Number(value)

  if (isNaN(num)) {
    throw new ApiError(400, `Field '${fieldName}' must be a valid number`)
  }

  if (options?.min !== undefined && num < options.min) {
    throw new ApiError(400, `Field '${fieldName}' must be at least ${options.min}`)
  }

  if (options?.max !== undefined && num > options.max) {
    throw new ApiError(400, `Field '${fieldName}' must be at most ${options.max}`)
  }

  return num
}

export function validateEmail(email: string | null | undefined, fieldName = "email"): void {
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, `Field '${fieldName}' must be a valid email address`)
  }
}

export function validateDate(date: string | null | undefined, fieldName: string): void {
  if (date && isNaN(new Date(date).getTime())) {
    throw new ApiError(400, `Field '${fieldName}' must be a valid date`)
  }
}

// Success response helper
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data } as ApiResponse<T>, { status })
}
