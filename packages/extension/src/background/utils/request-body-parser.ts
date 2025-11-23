const HEADER_NAME_CONTENT_TYPE = 'content-type';

export function parseRequestBodyToObject(
  body: string,
  headers?: Record<string, string>
): Record<string, any> | null {
  if (!body) {
    return null;
  }

  const contentType = getHeaderValue(headers, HEADER_NAME_CONTENT_TYPE);

  if (contentType?.includes('multipart/form-data')) {
    const boundary = extractBoundary(contentType) ?? inferBoundary(body);
    if (!boundary) {
      return null;
    }
    return parseMultipartFormData(body, boundary);
  }

  if (contentType?.includes('application/x-www-form-urlencoded')) {
    return parseFormUrlencoded(body);
  }

  if (contentType?.includes('application/json')) {
    return tryParseJson(body);
  }

  const fallback = tryParseJson(body);
  if (fallback) {
    return fallback;
  }

  if (!contentType && body.includes('=')) {
    return parseFormUrlencoded(body);
  }

  return null;
}

export function matchesObjectPattern(target: any, pattern: Record<string, any>): boolean {
  if (target === null || target === undefined) {
    return false;
  }

  return Object.entries(pattern).every(([key, expected]) => {
    const actual = target[key];

    if (isPlainObject(expected)) {
      if (!isPlainObject(actual)) {
        return false;
      }
      return matchesObjectPattern(actual, expected as Record<string, any>);
    }

    if (Array.isArray(expected)) {
      if (!Array.isArray(actual) || actual.length < expected.length) {
        return false;
      }
      return expected.every((value, index) => valuesEqual(actual[index], value));
    }

    return valuesEqual(actual, expected);
  });
}

function parseMultipartFormData(body: string, boundary: string): Record<string, any> {
  const result: Record<string, any> = {};
  const normalizedBoundary = boundary.startsWith('--') ? boundary : `--${boundary}`;
  const segments = body.split(normalizedBoundary);

  for (const segment of segments) {
    const trimmedSegment = segment.trim();
    if (!trimmedSegment || trimmedSegment === '--') {
      continue;
    }

    const [rawHeaders, ...rawBodyParts] = trimmedSegment.split(/\r?\n\r?\n/);
    if (!rawHeaders || rawBodyParts.length === 0) {
      continue;
    }

    const headers = rawHeaders.split(/\r?\n/);
    const dispositionLine = headers.find((line) =>
      line.toLowerCase().startsWith('content-disposition')
    );

    if (!dispositionLine) {
      continue;
    }

    const nameMatch = dispositionLine.match(/name="([^"]+)"/i);
    if (!nameMatch) {
      continue;
    }

    const name = nameMatch[1];
    let value = rawBodyParts.join('\r\n\r\n');
    // multipart 본문 끝에 남는 boundary 구분자 제거
    value = value.replace(/\r?\n--$/, '');
    value = value.replace(/\r?\n$/, '');
    result[name] = value;
  }

  return result;
}

function parseFormUrlencoded(body: string): Record<string, any> {
  const params = new URLSearchParams(body);
  const result: Record<string, any> = {};

  for (const [key, value] of params.entries()) {
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      const existing = result[key];
      result[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
      continue;
    }
    result[key] = value;
  }

  return result;
}

function tryParseJson(body: string): Record<string, any> | null {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function getHeaderValue(
  headers: Record<string, string> | undefined,
  name: string
): string | undefined {
  if (!headers) {
    return undefined;
  }

  const target = Object.keys(headers).find((key) => key.toLowerCase() === name.toLowerCase());
  return target ? headers[target] : undefined;
}

function extractBoundary(contentType: string): string | undefined {
  const match = contentType.match(/boundary=([^;]+)/i);
  if (!match) {
    return undefined;
  }
  return match[1].replace(/(^"|"$)/g, '');
}

function inferBoundary(body: string): string | undefined {
  const match = body.match(/^--+[\w-]+/m);
  if (!match) {
    return undefined;
  }
  return match[0].replace(/^--/, '');
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function valuesEqual(actual: any, expected: any): boolean {
  if (actual === expected) {
    return true;
  }

  if (typeof actual === 'string' && typeof expected === 'number' && isFiniteNumberString(actual)) {
    return Number(actual) === expected;
  }

  if (
    typeof actual === 'number' &&
    typeof expected === 'string' &&
    isFiniteNumberString(expected)
  ) {
    return actual === Number(expected);
  }

  if (typeof actual === 'boolean' || typeof expected === 'boolean') {
    return String(actual) === String(expected);
  }

  if (actual === undefined || expected === undefined) {
    return false;
  }

  return String(actual) === String(expected);
}

function isFiniteNumberString(value: string): boolean {
  if (!value.trim()) {
    return false;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed);
}
