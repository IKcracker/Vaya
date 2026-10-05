const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, imports = {}, globals = {}) {
  const source = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, { module, exports: module.exports, require: (id) => {
    if (id in imports) return imports[id]; throw new Error(`Unexpected import ${id}`);
  }, Buffer, Request, Response, Date, Error, console, ...globals });
  return module.exports;
}

const upload = load('web/lib/driver-document-upload.ts');
const definitions = load('web/lib/driver-verification.ts');
const pdf = Buffer.from('%PDF-1.7\nTest document\n%%EOF').toString('base64');

test('uploads verify actual file signatures, encoding and decoded size', () => {
  assert.equal(upload.validateDriverDocument('application/pdf', pdf).sizeBytes, Buffer.from(pdf, 'base64').length);
  assert.equal(upload.validateDriverDocument('image/jpeg', pdf).status, 400);
  assert.equal(upload.validateDriverDocument('application/pdf', '%%%=').status, 400);
  assert.equal(upload.validateDriverDocument('application/pdf', 'a'.repeat(4 * 1024 * 1024 + 4)).status, 413);
  for (const [mime, bytes] of [['image/jpeg', [255, 216, 255, 1]], ['image/png', [137, 80, 78, 71, 13, 10, 26, 10]]]) {
    assert.ok(upload.validateDriverDocument(mime, Buffer.from(bytes).toString('base64')).sizeBytes);
  }
  assert.equal(upload.validateDriverDocument('application/pdf', Buffer.alloc(2 * 1024 * 1024).toString('base64')).status, 400);
});

test('mobile uploads require identity, validate bytes, and persist only the authenticated driver', async () => {
  let saved;
  let identity = { status: 'authenticated', user: { email: 'driver@example.test' } };
  const route = load('web/app/api/mobile/driver/documents/route.ts', {
    '@/lib/db': { isDatabaseConfigured: () => true },
    '@/lib/db/driver-documents': { saveDriverDocumentByEmail: async (email, document) => { saved = { email, document }; return { document }; } },
    '@/lib/driver-verification': definitions,
    '@/lib/driver-document-upload': upload,
    '@/lib/passenger-auth': { getMobileSessionCookie: () => 'token', getPassengerSession: async () => identity, passengerAuthFailure: () => Response.json({}, { status: 503 }) },
  });
  const request = (mime = 'application/pdf') => new Request('https://vaya.example.test/api/mobile/driver/documents', {
    method: 'POST', body: JSON.stringify({ kind: 'identity', fileName: 'identity.pdf', contentType: mime, fileData: pdf, email: 'another@example.test' }),
  });
  assert.equal((await route.POST(request('image/png'))).status, 400);
  assert.equal(saved, undefined);
  assert.equal((await route.POST(request())).status, 201);
  assert.equal(saved.email, 'driver@example.test');
  identity = { status: 'unauthenticated' };
  assert.equal((await route.POST(request())).status, 401);
});

test('staff review requires admin access, confirmation, a current version and correction notes', async () => {
  let auth = { status: 'authorized', user: { email: 'reviewer@example.test' } };
  let reviewed;
  let changed = false;
  const route = load('web/app/api/admin/drivers/[id]/documents/[documentId]/route.ts', {
    '@/lib/db': { isDatabaseConfigured: () => true },
    '@/lib/admin-auth': { getAdminAuth: async () => auth },
    '@/lib/db/driver-documents': {
      DRIVER_DOCUMENT_STATUSES: new Set(['Review', 'Approved', 'Rejected', 'Needs info']),
      reviewDriverDocument: async (_driver, _document, input) => { if (changed) throw new Error('DOCUMENT_CHANGED'); reviewed = input; return { document: {} }; },
    },
  });
  const params = { params: Promise.resolve({ id: 'driver-1', documentId: 'document-1' }) };
  const review = (body) => route.PATCH(new Request('https://vaya.example.test/api/admin/drivers/driver-1/documents/document-1', { method: 'PATCH', body: JSON.stringify(body) }), params);
  const version = '2026-10-05T12:00:00.000Z';
  assert.equal((await review({ status: 'Approved', expectedUpdatedAt: version })).status, 400);
  assert.equal((await review({ status: 'Rejected', expectedUpdatedAt: version })).status, 400);
  assert.equal((await review({ status: 'Approved', expectedUpdatedAt: version, confirmed: true })).status, 200);
  assert.equal(reviewed.reviewer, 'reviewer@example.test');
  assert.equal(reviewed.expectedUpdatedAt, version);
  changed = true;
  assert.equal((await review({ status: 'Approved', expectedUpdatedAt: version, confirmed: true })).status, 409);
  auth = { status: 'forbidden' };
  assert.equal((await review({ status: 'Approved', expectedUpdatedAt: version, confirmed: true })).status, 403);
  assert.equal((await route.GET(new Request('https://vaya.example.test'), params)).status, 403);
});

test('approval requires every required document; optional insurance does not block it', async () => {
  let rows = [];
  const date = new Date('2026-10-05T12:00:00Z');
  const documents = load('web/lib/db/driver-documents.ts', {
    'server-only': {}, 'drizzle-orm': { eq: () => true }, '@/lib/driver-verification': definitions,
    './index': { getDb: () => ({ select: () => ({ from: () => ({ where: async () => rows }) }) }) },
    './schema': { driverDocuments: {}, drivers: {}, activityLogs: {} },
  });
  assert.equal((await documents.getDriverVerificationSummary('driver-1')).readyToApprove, false);
  rows = definitions.REQUIRED_DRIVER_DOCUMENTS.map((definition, index) => ({ ...definition, id: String(index), status: 'Approved', uploadedAt: date, updatedAt: date }));
  assert.equal((await documents.getDriverVerificationSummary('driver-1')).readyToApprove, true);
  rows[0].status = 'Review';
  assert.equal((await documents.getDriverVerificationSummary('driver-1')).readyToApprove, false);
  rows[0].status = 'Needs info';
  assert.equal((await documents.getDriverVerificationSummary('driver-1')).needsAttentionKinds.length, 1);
});

test('native document selection uses the cached file API without fetching file URIs', async () => {
  let cachedUri;
  const picker = load('mobile/src/lib/driver-documents.ts', {
    'expo-document-picker': { getDocumentAsync: async (options) => { assert.equal(options.copyToCacheDirectory, true); return { canceled: false, assets: [{ uri: 'file:///cache/identity.pdf', name: 'identity.pdf', mimeType: 'application/pdf', size: 29 }] }; } },
    'expo-file-system': { File: class { constructor(uri) { cachedUri = uri; this.size = 29; this.type = 'application/pdf'; } async base64() { return pdf; } } },
    'react-native': { Platform: { OS: 'ios' } },
  }, { fetch: () => { throw new Error('Native file URIs should use File'); } });
  const result = await picker.pickDriverDocument('identity');
  assert.equal(cachedUri, result.uri);
  assert.equal(result.fileData, pdf);
});
