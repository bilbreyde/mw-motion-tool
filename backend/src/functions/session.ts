import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { CosmosClient, Container } from '@azure/cosmos';

// Excludes 0/O and 1/I to avoid ambiguity when an SA reads the code aloud or writes it down.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const CODE_PREFIX = 'DW-';

let containerPromise: Promise<Container> | null = null;

function getContainer(): Promise<Container> {
  if (!containerPromise) {
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;
    const databaseId = process.env.COSMOS_DATABASE || 'motion-tool';
    const containerId = process.env.COSMOS_CONTAINER || 'sessions';

    if (!endpoint || !key) {
      containerPromise = null;
      throw new Error('Session storage not configured. Check COSMOS_ENDPOINT/COSMOS_KEY environment variables.');
    }

    const client = new CosmosClient({ endpoint, key });
    containerPromise = (async () => {
      const { database } = await client.databases.createIfNotExists({ id: databaseId });
      const { container } = await database.containers.createIfNotExists({
        id: containerId,
        partitionKey: { paths: ['/id'] },
      });
      return container;
    })();
  }
  return containerPromise;
}

function generateSessionCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return `${CODE_PREFIX}${code}`;
}

async function readItem(container: Container, code: string): Promise<Record<string, unknown> | undefined> {
  try {
    const { resource } = await container.item(code, code).read();
    return resource;
  } catch {
    return undefined;
  }
}

async function generateUniqueSessionCode(container: Container): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateSessionCode();
    const existing = await readItem(container, code);
    if (!existing) return code;
  }
  throw new Error('Failed to generate a unique session code — please try again');
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };
}

function optionsResponse(): HttpResponseInit {
  return {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  };
}

async function saveSessionHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (request.method === 'OPTIONS') return optionsResponse();

  try {
    const body = await request.json() as Record<string, unknown>;
    const { sessionCode, state } = body;

    if (!state || typeof state !== 'object') {
      return { status: 400, jsonBody: { error: 'Missing session state' }, headers: corsHeaders() };
    }

    const container = await getContainer();
    const now = new Date().toISOString();
    const s = state as Record<string, unknown>;
    const customerProfile = (s.customerProfile ?? {}) as Record<string, unknown>;
    const roadmapOutput = (s.roadmapOutput ?? {}) as Record<string, unknown>;
    const steps = Array.isArray(roadmapOutput.steps) ? roadmapOutput.steps : [];

    let code = typeof sessionCode === 'string' && sessionCode.trim() ? sessionCode.trim().toUpperCase() : null;
    let createdAt = now;

    if (code) {
      const existing = await readItem(container, code);
      if (existing && typeof existing.createdAt === 'string') createdAt = existing.createdAt;
    } else {
      code = await generateUniqueSessionCode(container);
    }

    const doc = {
      id: code,
      sessionCode: code,
      customerName: customerProfile.customerName ?? '',
      opportunityNumber: customerProfile.opportunityNumber ?? '',
      saName: customerProfile.saName ?? '',
      sellerName: customerProfile.sellerName ?? '',
      discoveryMode: s.discoveryMode ?? null,
      state: s,
      completionStatus: steps.length > 0 ? 'complete' : 'in-progress',
      createdAt,
      updatedAt: now,
    };

    await container.items.upsert(doc);

    return {
      status: 200,
      jsonBody: { sessionCode: code, updatedAt: now },
      headers: corsHeaders(),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    context.error('Session save error:', message);
    return { status: 500, jsonBody: { error: message }, headers: corsHeaders() };
  }
}

async function getSessionHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (request.method === 'OPTIONS') return optionsResponse();

  try {
    const rawCode = request.params.code;
    if (!rawCode) {
      return { status: 400, jsonBody: { error: 'Missing session code' }, headers: corsHeaders() };
    }
    const code = rawCode.trim().toUpperCase();

    const container = await getContainer();
    const resource = await readItem(container, code);

    if (!resource) {
      return { status: 404, jsonBody: { error: `Session ${code} not found` }, headers: corsHeaders() };
    }

    return {
      status: 200,
      jsonBody: {
        sessionCode: resource.sessionCode,
        state: resource.state,
        completionStatus: resource.completionStatus,
        updatedAt: resource.updatedAt,
      },
      headers: corsHeaders(),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    context.error('Session load error:', message);
    return { status: 500, jsonBody: { error: message }, headers: corsHeaders() };
  }
}

app.http('session-save', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'session',
  handler: saveSessionHandler,
});

app.http('session-get', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'session/{code}',
  handler: getSessionHandler,
});
