import crypto from 'node:crypto';

export type CloudinaryResourceType = 'image' | 'video' | 'raw' | 'auto';

export interface MediaUploadValidationResult {
  ok: boolean;
  message?: string;
  resourceType?: CloudinaryResourceType;
  extension?: string;
}

export interface CloudinaryUploadResult {
  assetId: string;
  publicId: string;
  resourceType: CloudinaryResourceType;
  format: string | null;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  url: string;
  secureUrl: string;
  thumbnailUrl: string | null;
}

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);

const DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

const LEGACY_OFFICE_EXTENSIONS = new Set(['doc', 'xls', 'ppt']);
const OFFICE_OPEN_XML_EXTENSIONS = new Set(['docx', 'xlsx', 'pptx']);

const VIDEO_MIME_PREFIXES = ['video/'];
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'm4v', 'webm', 'avi', 'mkv']);

export function getMediaUploadLimitBytes(): number {
  const fallback = 100 * 1024 * 1024;
  const raw = process.env.MEDIA_UPLOAD_MAX_BYTES?.trim();
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function requireCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary is not configured');
  }

  return { cloudName, apiKey, apiSecret };
}

export function sanitizeFilename(filename: string): string {
  const sanitized = filename
    .trim()
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 0x20 && code !== 0x7f;
    })
    .join('')
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/\.+/g, '.')
    .replace(/^[.\s-]+/, '')
    .replace(/[.\s-]+$/, '');

  return (sanitized || 'media-file').slice(0, 160);
}

export function getFileExtension(filename: string): string | null {
  const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || null;
}

export function inferResourceType(mimeType: string): CloudinaryResourceType {
  const normalized = mimeType.toLowerCase();
  if (IMAGE_MIME_TYPES.has(normalized)) return 'image';
  if (VIDEO_MIME_PREFIXES.some((prefix) => normalized.startsWith(prefix))) return 'video';
  return 'raw';
}

async function readFilePrefix(file: File, length = 16): Promise<Uint8Array> {
  const buffer = await file.slice(0, length).arrayBuffer();
  return new Uint8Array(buffer);
}

function isPng(bytes: Uint8Array): boolean {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return signature.every((value, index) => bytes[index] === value);
}

function isJpeg(bytes: Uint8Array): boolean {
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function isGif(bytes: Uint8Array): boolean {
  return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38;
}

function isWebp(bytes: Uint8Array): boolean {
  const ascii = (start: number, value: string) =>
    value.split('').every((char, index) => bytes[start + index] === char.charCodeAt(0));

  return ascii(0, 'RIFF') && ascii(8, 'WEBP');
}

function isPdf(bytes: Uint8Array): boolean {
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;
}

function isZipArchive(bytes: Uint8Array): boolean {
  return (
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    ((bytes[2] === 0x03 && bytes[3] === 0x04) ||
      (bytes[2] === 0x05 && bytes[3] === 0x06) ||
      (bytes[2] === 0x07 && bytes[3] === 0x08))
  );
}

function containsAscii(bytes: Uint8Array, needle: string): boolean {
  const search = new TextEncoder().encode(needle);
  if (search.length === 0 || search.length > bytes.length) {
    return false;
  }

  outer: for (let index = 0; index <= bytes.length - search.length; index += 1) {
    for (let offset = 0; offset < search.length; offset += 1) {
      if (bytes[index + offset] !== search[offset]) {
        continue outer;
      }
    }

    return true;
  }

  return false;
}

async function readFileBytes(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}

function getOfficeOpenXmlMarkers(extension: string): string[] {
  switch (extension) {
    case 'docx':
      return ['[Content_Types].xml', 'word/'];
    case 'xlsx':
      return ['[Content_Types].xml', 'xl/'];
    case 'pptx':
      return ['[Content_Types].xml', 'ppt/'];
    default:
      return [];
  }
}

async function validateOfficeOpenXmlFile(file: File, extension: string): Promise<MediaUploadValidationResult> {
  const bytes = await readFileBytes(file);

  if (!isZipArchive(bytes)) {
    return {
      ok: false,
      message: 'Office files must be valid OOXML ZIP containers.',
    };
  }

  const requiredMarkers = getOfficeOpenXmlMarkers(extension);
  const missingMarker = requiredMarkers.find((marker) => !containsAscii(bytes, marker));
  if (missingMarker) {
    return {
      ok: false,
      message: 'Office file contents do not match the declared OOXML format.',
    };
  }

  return { ok: true, resourceType: 'raw', extension };
}

export interface MediaReferenceMatch {
  path: string;
  value: string;
}

const MEDIA_REFERENCE_KEYS = new Set([
  'featuredImage',
  'imageUrl',
  'image',
  'mediaUrl',
  'mediaId',
  'assetId',
  'publicId',
  'secureUrl',
  'thumbnailUrl',
  'url',
  'src',
  'href',
  'poster',
  'logoUrl',
  'backgroundImage',
  'backgroundImageUrl',
  'heroImage',
  'heroImageUrl',
  'bannerImage',
  'bannerImageUrl',
  'coverImage',
  'coverImageUrl',
  'downloadUrl',
  'fileUrl',
]);

const HTML_MEDIA_ATTRIBUTE_PATTERN = /(?:src|href|poster|data-src|data-media-url|data-image-url)\s*=\s*(?:"([^"]+)"|'([^']+)')/gi;
const CSS_MEDIA_URL_PATTERN = /url\(\s*(?:"([^"]+)"|'([^']+)'|([^)"'\s]+))\s*\)/gi;

function normalizeReferenceValue(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function collectReferenceValuesFromHtml(html: string): string[] {
  const values = new Set<string>();

  for (const pattern of [HTML_MEDIA_ATTRIBUTE_PATTERN, CSS_MEDIA_URL_PATTERN]) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      const rawValue = match[1] || match[2] || match[3];
      const normalized = normalizeReferenceValue(rawValue);
      if (normalized) {
        values.add(normalized);
      }
    }
  }

  return Array.from(values);
}

function isLikelyHtml(value: string): boolean {
  return /<[^>]+>/.test(value);
}

function addMatch(
  matches: MediaReferenceMatch[],
  seen: Set<string>,
  path: string[],
  value: string,
) {
  const key = `${path.join('.') || 'body'}::${value}`;
  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  matches.push({ path: path.join('.') || 'body', value });
}

export function collectMediaReferenceCandidates(asset: {
  id?: string | null;
  url?: string | null;
  secureUrl?: string | null;
  thumbnailUrl?: string | null;
  publicId?: string | null;
}): Set<string> {
  return new Set(
    [asset.id, asset.url, asset.secureUrl, asset.thumbnailUrl, asset.publicId]
      .map((value) => normalizeReferenceValue(value))
      .filter((value): value is string => Boolean(value)),
  );
}

export function findMediaReferenceMatches(
  value: unknown,
  candidates: Set<string>,
  path: string[] = [],
  seen = new Set<string>(),
): MediaReferenceMatch[] {
  const matches: MediaReferenceMatch[] = [];

  if (typeof value === 'string') {
    const normalized = normalizeReferenceValue(value);
    if (!normalized) {
      return matches;
    }

    for (const candidate of candidates) {
      if (normalized === candidate) {
        addMatch(matches, seen, path, candidate);
        return matches;
      }
    }

    if (isLikelyHtml(normalized)) {
      for (const extracted of collectReferenceValuesFromHtml(normalized)) {
        for (const candidate of candidates) {
          if (extracted === candidate) {
            addMatch(matches, seen, path, candidate);
            break;
          }
        }
      }
    }

    return matches;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      matches.push(...findMediaReferenceMatches(entry, candidates, [...path, String(index)], seen));
    });

    return matches;
  }

  if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      const nextPath = [...path, key];
      if (MEDIA_REFERENCE_KEYS.has(key) && typeof nested === 'string') {
        const normalized = normalizeReferenceValue(nested);
        if (normalized) {
          for (const candidate of candidates) {
            if (normalized === candidate) {
              addMatch(matches, seen, nextPath, candidate);
              break;
            }
          }
        }
      }

      matches.push(...findMediaReferenceMatches(nested, candidates, nextPath, seen));
    }
  }

  return matches;
}

export async function validateMediaFile(file: File): Promise<MediaUploadValidationResult> {
  const mimeType = (file.type || '').toLowerCase();
  const extension = getFileExtension(file.name);
  const sizeLimit = getMediaUploadLimitBytes();

  if (!file.name || !extension) {
    return { ok: false, message: 'File must have a valid filename and extension.' };
  }

  if (file.size <= 0) {
    return { ok: false, message: 'File appears to be empty.' };
  }

  if (file.size > sizeLimit) {
    return { ok: false, message: `File exceeds the upload limit of ${Math.round(sizeLimit / 1024 / 1024)} MB.` };
  }

  if (LEGACY_OFFICE_EXTENSIONS.has(extension)) {
    return {
      ok: false,
      message: 'Legacy binary Office formats (.doc, .xls, .ppt) are not supported in this phase. Please upload DOCX, XLSX, or PPTX.',
    };
  }

  if (mimeType && IMAGE_MIME_TYPES.has(mimeType)) {
    if (mimeType === 'image/svg+xml') {
      return {
        ok: false,
        message: 'SVG uploads are disabled in this phase for safety.',
      };
    }

    if (!IMAGE_EXTENSIONS.has(extension)) {
      return {
        ok: false,
        message: 'Image extension does not match an allowed image file type.',
      };
    }

    const prefix = await readFilePrefix(file, 16);
    const signatureMatches =
      (extension === 'png' && isPng(prefix)) ||
      ((extension === 'jpg' || extension === 'jpeg') && isJpeg(prefix)) ||
      (extension === 'gif' && isGif(prefix)) ||
      (extension === 'webp' && isWebp(prefix));

    if (!signatureMatches) {
      return {
        ok: false,
        message: 'Image contents do not match the declared file type.',
      };
    }

    return { ok: true, resourceType: 'image', extension };
  }

  if (extension === 'pdf') {
    const prefix = await readFilePrefix(file, 8);
    if (!isPdf(prefix)) {
      return {
        ok: false,
        message: 'PDF contents do not match the declared file type.',
      };
    }

    return { ok: true, resourceType: 'raw', extension };
  }

  if (OFFICE_OPEN_XML_EXTENSIONS.has(extension)) {
    return validateOfficeOpenXmlFile(file, extension);
  }

  if (mimeType && DOCUMENT_MIME_TYPES.has(mimeType)) {
    return {
      ok: false,
      message: 'Only PDF and OOXML Office files (.docx, .xlsx, .pptx) are supported in this phase.',
    };
  }

  if (mimeType && VIDEO_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix))) {
    if (!VIDEO_EXTENSIONS.has(extension)) {
      return {
        ok: false,
        message: 'Video extension does not match an allowed video file type.',
      };
    }

    return { ok: true, resourceType: 'video', extension };
  }

  return {
    ok: false,
    message: 'Unsupported file type. Please upload an approved image, document, or video file.',
  };
}

function signaturePayload(params: Record<string, string | number | undefined | null>) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

export function createCloudinarySignature(params: Record<string, string | number | undefined | null>): string {
  const { apiSecret } = requireCloudinaryConfig();
  return crypto.createHash('sha1').update(`${signaturePayload(params)}${apiSecret}`).digest('hex');
}

export function buildCloudinaryUploadUrl(resourceType: CloudinaryResourceType): string {
  const { cloudName } = requireCloudinaryConfig();
  return `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
}

export function buildCloudinaryDestroyUrl(resourceType: CloudinaryResourceType): string {
  const { cloudName } = requireCloudinaryConfig();
  return `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`;
}

export function buildCloudinaryThumbnailUrl(
  secureUrl: string | null | undefined,
  resourceType: CloudinaryResourceType,
): string | null {
  if (!secureUrl) {
    return null;
  }

  if (resourceType !== 'image') {
    return secureUrl;
  }

  return secureUrl.replace('/upload/', '/upload/c_fill,w_480,h_320,g_auto,f_auto,q_auto/');
}

export function normalizeCloudinaryUploadResponse(params: {
  file: File;
  response: Record<string, unknown>;
  title?: string | null;
  description?: string | null;
  altText?: string | null;
  caption?: string | null;
  folder?: string | null;
  publicIdOverride?: string | null;
}): CloudinaryUploadResult {
  const filename = sanitizeFilename(params.file.name);
  const originalFilename = params.file.name;
  const resourceType = ((params.response.resource_type as CloudinaryResourceType) || inferResourceType(params.file.type)) as CloudinaryResourceType;
  const publicId =
    (typeof params.response.public_id === 'string' && params.response.public_id) ||
    params.publicIdOverride ||
    filename.replace(/\.[^.]+$/, '');
  const secureUrl =
    (typeof params.response.secure_url === 'string' && params.response.secure_url) ||
    (typeof params.response.url === 'string' && params.response.url) ||
    '';
  const width = typeof params.response.width === 'number' ? params.response.width : null;
  const height = typeof params.response.height === 'number' ? params.response.height : null;
  const format = typeof params.response.format === 'string' ? params.response.format : null;

  return {
    assetId: typeof params.response.asset_id === 'string' ? params.response.asset_id : publicId,
    publicId,
    resourceType,
    format,
    filename,
    originalFilename,
    mimeType: params.file.type || (typeof params.response.mime_type === 'string' ? params.response.mime_type : 'application/octet-stream'),
    size: typeof params.response.bytes === 'number' ? params.response.bytes : params.file.size,
    width,
    height,
    url: secureUrl,
    secureUrl,
    thumbnailUrl: buildCloudinaryThumbnailUrl(secureUrl, resourceType),
  };
}

export async function uploadToCloudinary(params: {
  file: File;
  resourceType: CloudinaryResourceType;
  folder?: string | null;
  publicId?: string | null;
  overwrite?: boolean;
  tags?: string[];
}): Promise<CloudinaryUploadResult> {
  const { apiKey } = requireCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const requestParams: Record<string, string | number | undefined | null> = {
    timestamp,
    resource_type: params.resourceType,
    folder: params.folder?.trim() || undefined,
    public_id: params.publicId?.trim() || undefined,
    overwrite: params.overwrite === false ? 'false' : 'true',
    unique_filename: 'false',
  };

  const signature = createCloudinarySignature(requestParams);
  const form = new FormData();
  form.append('file', params.file, params.file.name);
  form.append('api_key', apiKey);
  form.append('timestamp', timestamp);
  form.append('signature', signature);
  form.append('resource_type', params.resourceType);
  form.append('overwrite', params.overwrite === false ? 'false' : 'true');
  form.append('unique_filename', 'false');

  if (params.folder?.trim()) {
    form.append('folder', params.folder.trim());
  }

  if (params.publicId?.trim()) {
    form.append('public_id', params.publicId.trim());
  }

  if (params.tags?.length) {
    form.append('tags', params.tags.join(','));
  }

  const response = await fetch(buildCloudinaryUploadUrl(params.resourceType), {
    method: 'POST',
    body: form,
  });

  const payload = (await response.json().catch(async () => ({ message: await response.text() }))) as Record<string, unknown>;

  if (!response.ok) {
    const message = typeof payload.error === 'object' && payload.error && 'message' in payload.error
      ? String((payload.error as Record<string, unknown>).message || 'Cloudinary upload failed')
      : typeof payload.message === 'string'
        ? payload.message
        : 'Cloudinary upload failed';
    throw new Error(message);
  }

  return normalizeCloudinaryUploadResponse({
    file: params.file,
    response: payload,
  });
}

export async function destroyFromCloudinary(params: {
  publicId: string;
  resourceType: CloudinaryResourceType;
}): Promise<void> {
  const { apiKey } = requireCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const requestParams: Record<string, string | number | undefined | null> = {
    timestamp,
    public_id: params.publicId,
    resource_type: params.resourceType,
  };

  const signature = createCloudinarySignature(requestParams);
  const form = new FormData();
  form.append('public_id', params.publicId);
  form.append('api_key', apiKey);
  form.append('timestamp', timestamp);
  form.append('signature', signature);

  const response = await fetch(buildCloudinaryDestroyUrl(params.resourceType), {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      payload && typeof payload.error === 'object' && payload.error && 'message' in payload.error
        ? String((payload.error as Record<string, unknown>).message || 'Cloudinary delete failed')
        : 'Cloudinary delete failed';
    throw new Error(message);
  }
}
