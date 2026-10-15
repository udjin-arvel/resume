export function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase)
  }
  if (obj && typeof obj === "object") {
    return Object.entries(obj).reduce((res, [key, value]) => {
      const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
      res[camelKey] = toCamelCase(value)
      return res
    }, {} as Record<string, any>)
  }
  return obj
}

export function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase)
  }
  if (obj && typeof obj === "object") {
    return Object.entries(obj).reduce((res, [key, value]) => {
      const snakeKey = key.replace(/[A-Z]/g, c => "_" + c.toLowerCase())
      res[snakeKey] = toSnakeCase(value)
      return res
    }, {} as Record<string, any>)
  }
  return obj
}

export function toSnakeCaseString(value: string): string {
  return value.replace(/[A-Z]/g, c => "_" + c.toLowerCase())
}
