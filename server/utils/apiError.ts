import { createError } from 'h3'

export const API_ERRORS = {
  FORBIDDEN:       { statusCode: 403, code: 'FORBIDDEN'        },
  NOT_FOUND:       { statusCode: 404, code: 'NOT_FOUND'        },
  DUPLICATE_PHONE: { statusCode: 409, code: 'DUPLICATE_PHONE'  },
  VALIDATION:      { statusCode: 422, code: 'VALIDATION_ERROR' },
  RATE_LIMITED:    { statusCode: 429, code: 'RATE_LIMITED'     },
  INTERNAL:        { statusCode: 500, code: 'INTERNAL_ERROR'   },
  UNAUTHENTICATED: { statusCode: 401, code: 'UNAUTHENTICATED'  },
} as const

export type ApiErrorKey = keyof typeof API_ERRORS

export function throwApiError(key: ApiErrorKey, message?: string, data?: Record<string, unknown>): never {
  const { statusCode, code } = API_ERRORS[key]
  throw createError({
    statusCode,
    message: message ?? code,
    data: { code, ...data },
  })
}
