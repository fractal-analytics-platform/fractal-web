/**
 * These endpoints act like a proxy, forwarding all /api/admin requests to the /admin Python backend
 */
import { createDeleteProxy, createGetProxy, createPatchProxy, createPostProxy } from '../../../proxy';

export const GET = createGetProxy('admin');
export const POST = createPostProxy('admin');
export const PATCH = createPatchProxy('admin');
export const DELETE = createDeleteProxy('admin');
