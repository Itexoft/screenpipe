import { Env, TranscriptionModelType, TranscriptionOptions } from '../types';
import { validateAudioInput, transcribeAudio } from '../utils/voice-utils';
import { createSuccessResponse, createErrorResponse } from '../utils/cors';

export async function handleVoiceTranscription(request: Request, env: Env): Promise<Response> {
  const validation = await validateAudioInput(request);
  if (!validation.valid || !validation.audioBuffer) {
    return createErrorResponse(400, validation.error || 'Invalid audio input');
  }

  const languages = request.headers.get('detect_language')?.split(',') || ['en'];
  const sampleRate = request.headers.get('sample_rate') || '16000';
  const model: TranscriptionModelType =
    (request.headers.get('transcription_model') as TranscriptionModelType) || 'nova-3';
  const diarize = request.headers.get('diarize') === 'true';

  const transcriptionResult = await transcribeAudio(validation.audioBuffer, env, {
    languages,
    sampleRate,
    model,
    diarize,
    smartFormat: true,
  });

  if (transcriptionResult.error || !transcriptionResult.text) {
    return createErrorResponse(400, transcriptionResult.error || 'No speech detected in the audio');
  }

  return createSuccessResponse({
    transcription: transcriptionResult.text,
    confidence: transcriptionResult.confidence,
    language: transcriptionResult.language,
    words: transcriptionResult.words,
  });
}

