/**
 * These endpoints act like a proxy, forwarding all /api requests to the Python backend
 */
import { createDeleteProxy, createGetProxy, createPatchProxy, createPostProxy } from '../../proxy';

export const GET = createGetProxy('api');
export const POST = createPostProxy('api');
export const PATCH = createPatchProxy('api');
export const DELETE = createDeleteProxy('api');
