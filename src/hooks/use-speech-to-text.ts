
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

// Define a type for the SpeechRecognition API to avoid 'any'
// and provide some basic type safety for browser-specific APIs.
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
}

type UseSpeechToTextProps = {
  onCommand?: (command: string) => void;
  onTranscript?: (transcript: string) => void;
  onListen?: (isListening: boolean) => void;
};

export function useSpeechToText(props: UseSpeechToTextProps = {}) {
  const [isListening, setIsListening] = useState(false);
  // Default to false and update in useEffect to prevent hydration mismatch.
  const [hasRecognitionSupport, setHasRecognitionSupport] = useState(false);
  
  const propsRef = useRef(props);
  propsRef.current = props;
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // This ref helps us track if the user intentionally stopped listening
  const userStoppedRef = useRef(false);

  // Check for SpeechRecognition support on the client-side after mount.
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      setHasRecognitionSupport(true);
    }
  }, []);

  // This effect sets up and tears down the recognition instance.
  useEffect(() => {
    if (!hasRecognitionSupport) {
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionAPI();
    const recognition = recognitionRef.current;

    const isTranscriptMode = !!propsRef.current.onTranscript;
    const isCommandMode = !!propsRef.current.onCommand;

    recognition.continuous = isTranscriptMode;
    recognition.interimResults = isTranscriptMode;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      propsRef.current.onListen?.(true);
    };

    recognition.onend = () => {
      setIsListening(false);
      propsRef.current.onListen?.(false);
      // This is the key fix for mobile: if the browser stops listening on its own,
      // and the user didn't manually stop it, restart it.
      if (isTranscriptMode && !userStoppedRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.error("Could not restart recognition service.", e);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'no-speech' && event.error !== 'not-allowed' && event.error !== 'aborted') {
        console.error('Speech recognition error:', event.error);
      }
      userStoppedRef.current = true; // Treat errors as a manual stop to prevent loops
      setIsListening(false);
      propsRef.current.onListen?.(false);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');

      if (isTranscriptMode) {
        propsRef.current.onTranscript?.(transcript);
      }

      const lastResult = event.results[event.results.length - 1];
      if (isCommandMode && lastResult.isFinal) {
        const command = lastResult[0].transcript.trim();
        propsRef.current.onCommand?.(command);
        recognition.stop();
      }
    };

    return () => {
      if (recognitionRef.current) {
        userStoppedRef.current = true;
        recognitionRef.current.stop();
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
      }
    };
  }, [hasRecognitionSupport]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      userStoppedRef.current = false;
      propsRef.current.onTranscript?.('');
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Could not start speech recognition', e);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      userStoppedRef.current = true;
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Could not stop speech recognition', e);
      }
    }
  }, [isListening]);

  return {
    isListening,
    startListening,
    stopListening,
    hasRecognitionSupport,
  };
}
