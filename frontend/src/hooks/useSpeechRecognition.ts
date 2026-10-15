import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { TranscriptSegment } from '../types';
import { transcriptService } from '../services';

interface UseSpeechRecognitionOptions {
  socket: Socket | null;
  roomId: string;
  meetingId?: string;
  speakerName: string;
  enabled: boolean;
  hasConsent: boolean;
}

export const useSpeechRecognition = ({
  socket,
  roomId,
  meetingId,
  speakerName,
  enabled,
  hasConsent,
}: UseSpeechRecognitionOptions) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [interimText, setInterimText] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Idle');

  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setStatusMessage('Web Speech API not supported in this browser. Demo or STUN audio upload available.');
    }
  }, []);

  // Listen for socket transcript segments from all participants in room
  useEffect(() => {
    if (!socket) return;

    const handleSegmentReceived = (segment: TranscriptSegment) => {
      setTranscriptSegments((prev) => [...prev, segment]);
    };

    socket.on('transcript-segment-received', handleSegmentReceived);

    return () => {
      socket.off('transcript-segment-received', handleSegmentReceived);
    };
  }, [socket]);

  // Load existing transcript from backend if meetingId is available
  useEffect(() => {
    if (!meetingId) return;

    transcriptService
      .getTranscript(meetingId)
      .then((res) => {
        if (res.data?.segments) {
          setTranscriptSegments(res.data.segments);
        }
      })
      .catch((err) => {
        console.warn('[Transcript] Could not fetch saved transcript:', err.message);
      });
  }, [meetingId]);

  // Start / Stop speech recognition
  useEffect(() => {
    if (!isSupported || !enabled || !hasConsent) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsTranscribing(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsTranscribing(true);
      setStatusMessage('Live speech-to-text active (Participant notice & consent acknowledged)');
      startTimeRef.current = Date.now();
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          const currentOffsetSec = Math.round((Date.now() - startTimeRef.current) / 1000);
          const segmentData: TranscriptSegment = {
            meetingId: meetingId || '',
            speakerName,
            text: text.trim(),
            startTime: Math.max(0, currentOffsetSec - 3),
            endTime: currentOffsetSec,
            confidence: event.results[i][0].confidence || 0.95,
            source: 'browser_api',
            createdAt: new Date().toISOString(),
          };

          // Save to backend if meetingId exists
          if (meetingId) {
            transcriptService.addSegment({
              ...segmentData,
              meetingId,
            }).catch((err) => console.warn('[Transcript] Save segment error:', err));
          }

          // Broadcast to other participants via socket
          if (socket) {
            socket.emit('broadcast-transcript-segment', {
              roomId,
              ...segmentData,
            });
          }

          setTranscriptSegments((prev) => [...prev, segmentData]);
          setInterimText('');
        } else {
          interim += text;
        }
      }
      setInterimText(interim);
    };

    recognition.onerror = (event: any) => {
      console.warn('[SpeechRecognition] Error:', event.error);
      if (event.error === 'not-allowed') {
        setStatusMessage('Microphone access denied for transcription.');
        setIsTranscribing(false);
      } else {
        setStatusMessage(`Transcription warning: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still enabled
      if (enabled && hasConsent) {
        try {
          recognition.start();
        } catch (e) {
          setIsTranscribing(false);
        }
      } else {
        setIsTranscribing(false);
        setStatusMessage('Transcription paused.');
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e: any) {
      console.warn('[SpeechRecognition] Could not start:', e.message);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [enabled, hasConsent, isSupported, roomId, meetingId, speakerName, socket]);

  // Seed sample demo transcript
  const loadDemoTranscript = useCallback(async () => {
    if (!meetingId) return;
    try {
      setStatusMessage('Loading demo transcript...');
      const res = await transcriptService.seedSampleTranscript(meetingId);
      if (res.data?.segments) {
        setTranscriptSegments(res.data.segments);
        setStatusMessage('Demo transcript loaded (clearly marked source: demo)');
      }
    } catch (err: any) {
      console.error('[Transcript] Failed to load demo transcript:', err);
      setStatusMessage('Error loading demo transcript');
    }
  }, [meetingId]);

  return {
    isTranscribing,
    transcriptSegments,
    interimText,
    isSupported,
    statusMessage,
    loadDemoTranscript,
  };
};
