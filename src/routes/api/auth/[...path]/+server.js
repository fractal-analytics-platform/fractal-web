/**
 * These endpoints act like a proxy, forwarding all /api/auth requests to the /auth Python backend
 */
import { createDeleteProxy, createGetProxy, createPatchProxy, createPostProxy } from '../../../proxy';

export const GET = createGetProxy('auth');
export const POST = createPostProxy('auth');
export const PATCH = createPatchProxy('auth');
export const DELETE = createDeleteProxy('auth');
