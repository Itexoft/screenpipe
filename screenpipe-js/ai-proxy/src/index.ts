import { Env, RequestBody } from './types';
import { handleOptions, createSuccessResponse, createErrorResponse } from './utils/cors';
import { validateAuth } from './utils/auth';
import { RateLimiter, checkRateLimit } from './utils/rate-limiter';
import { handleChatCompletions } from './handlers/chat';
import { handleModelListing } from './handlers/models';
import { handleFileTranscription, handleWebSocketUpgrade } from './handlers/transcription';
import { handleVoiceTranscription } from './handlers/voice';

export { RateLimiter };

export default {
  // @ts-ignore
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      if (request.method === 'OPTIONS') {
        return handleOptions(request);
      }

      const rateLimit = await checkRateLimit(request, env);
      if (!rateLimit.allowed && rateLimit.response) {
        return rateLimit.response;
      }

      const url = new URL(request.url);
      const path = url.pathname;
      console.log('path', path);

      const upgradeHeader = request.headers.get('upgrade')?.toLowerCase();
      if (path === '/v1/listen' && upgradeHeader === 'websocket') {
        console.log('websocket request to /v1/listen detected, bypassing auth');
        return await handleWebSocketUpgrade(request, env);
      }

      if (path !== '/test') {
        const authResult = await validateAuth(request, env);
        if (!authResult.isValid) {
          return createErrorResponse(401, authResult.error || 'unauthorized');
        }
      }

      if (path === '/test') {
        return createSuccessResponse('ai proxy is working!');
      }

      if (path === '/v1/chat/completions' && request.method === 'POST') {
        const body = (await request.json()) as RequestBody;
        return await handleChatCompletions(body, env);
      }

      if (path === '/v1/listen' && request.method === 'POST') {
        return await handleFileTranscription(request, env);
      }

      if (path === '/v1/models' && request.method === 'GET') {
        return await handleModelListing(env);
      }

      if (path === '/v1/voice/transcribe' && request.method === 'POST') {
        return await handleVoiceTranscription(request, env);
      }

      return createErrorResponse(404, 'not found');
    } catch (error: any) {
      console.error('error in fetch:', error);
      return createErrorResponse(500, 'an error occurred');
    }
  },
} satisfies ExportedHandler<Env>;

