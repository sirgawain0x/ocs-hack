import { NextResponse } from 'next/server'

export const runtime = 'edge'

const customSecretMappings: Record<string, string> = {
  "secret_cm98tgbme00003b6rjf0egbe3": "f01b356e31a306f1710853e8bd533030"
}

function createSecretMap(): Map<string, string> {
  const secretMap = new Map<string, string>()

  for (const [key, value] of Object.entries(customSecretMappings)) {
    secretMap.set(key, value)
  }

  return secretMap
}

export async function GET(request: Request) {
  return handleRequest(request)
}

export async function POST(request: Request) {
  return handleRequest(request)
}

export async function PUT(request: Request) {
  return handleRequest(request)
}

export async function PATCH(request: Request) {
  return handleRequest(request)
}

export async function DELETE(request: Request) {
  return handleRequest(request)
}

async function handleRequest(request: Request) {
  type ProxyParsed = {
    protocol: string
    origin: string
    path: string
    method: string
    headers: Record<string, string>
    body: FormData | unknown
  }
  let parsed: ProxyParsed | Record<string, unknown>
  const wordMap = createSecretMap()

  const contentType = request.headers.get('content-type')

  if (!contentType) {
    return NextResponse.json(
      { error: 'Missing content-type header in the request' },
      { status: 400 },
    )
  }

  if (contentType.includes('multipart/form-data')) {
    const proxyRequest = await request.formData()
    const parsedMultipart: ProxyParsed = {
      protocol: '',
      origin: '',
      path: '',
      method: '',
      headers: {},
      body: new FormData(),
    }

    for (const [key, value] of proxyRequest.entries()) {
      if (key.startsWith('body[') && key.endsWith(']')) {
        const fieldName = key.slice(5, -1)
        const replaced = replaceMaskedWordsWithSecrets(value, wordMap)
        const v = typeof replaced === 'string' || replaced instanceof Blob
          ? replaced
          : String(replaced)
        ;(parsedMultipart.body as FormData).append(fieldName, v)
      } else if (key === 'headers') {
        try {
          parsedMultipart.headers = replaceMaskedWordsWithSecrets(
            JSON.parse(String(value)),
            wordMap,
          ) as Record<string, string>
        } catch {
          return NextResponse.json(
            {
              error: 'Invalid headers in the body - must be a JSON object',
            },
            { status: 400 },
          )
        }
      } else {
        ;(parsedMultipart as Record<string, unknown>)[key] = replaceMaskedWordsWithSecrets(
          value,
          wordMap,
        )
      }
    }
    parsed = parsedMultipart
  } else if (contentType.includes('application/json')) {
    try {
      parsed = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    if (wordMap.size > 0) {
      parsed = replaceMaskedWordsWithSecrets(parsed, wordMap) as Record<string, unknown>
    }
  } else {
    return NextResponse.json(
      { error: 'Unsupported content-type header' },
      { status: 400 },
    )
  }

  const { protocol, origin, path, method, headers, body } = parsed as ProxyParsed

  if (!protocol || !origin || !path || !method || !headers) {
    return NextResponse.json(
      { error: 'Missing required fields in request body' },
      { status: 400 },
    )
  }

  const fetchHeaders = new Headers(headers)
  if (contentType.includes('multipart/form-data')) {
    fetchHeaders.delete('content-type') // fetch sets the header automatically
  }

  try {
    const response = await fetch(
      `${protocol}://${origin}/${path.startsWith('/') ? path.slice(1) : path}`,
      {
        method,
        body:
          typeof body === 'string' || body instanceof FormData
            ? body
            : JSON.stringify(body),
        headers: fetchHeaders,
      },
    )

    const contentType = response.headers.get('content-type') || 'application/json'
    const responseBody = contentType.includes('application/json')
      ? await response.json()
      : await response.text()

    // Forward upstream status and content type to surface errors correctly
    return new NextResponse(
      contentType.includes('application/json') ? JSON.stringify(responseBody) : String(responseBody),
      {
        status: response.status,
        headers: {
          'content-type': contentType,
        },
      },
    )
  } catch (_error) {
    const message =
      _error && typeof _error === 'object' && 'message' in _error
        ? String(((_error as unknown) as { message?: string }).message ?? 'Unknown error')
        : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch external API', details: message },
      { status: 500 },
    )
  }
}

function replaceMaskedWordsWithSecrets(
  obj: unknown,
  wordMap: Map<string, string>,
): unknown {
  if (typeof obj === 'string') {
    return replaceInString(obj, wordMap)
  } else if (
    typeof obj === 'object' &&
    obj !== null &&
    (obj as { constructor?: { name?: string } }).constructor?.name === 'File'
  ) {
    return obj
  } else if (Array.isArray(obj)) {
    return obj.map((item) => replaceMaskedWordsWithSecrets(item, wordMap))
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj: Record<string, unknown> = {}
    for (const key in obj as Record<string, unknown>) {
      newObj[key] = replaceMaskedWordsWithSecrets(
        (obj as Record<string, unknown>)[key],
        wordMap,
      )
    }
    return newObj
  }
  return obj
}

function replaceInString(str: string, wordMap: Map<string, string>): string {
  for (const [word, replacement] of Array.from(wordMap.entries())) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    str = str.replace(regex, replacement)
  }
  return str
}
