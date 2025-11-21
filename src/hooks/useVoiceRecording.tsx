import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useVoiceRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      // Check if we're in a secure context
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Seu navegador não suporta gravação de áudio ou a página precisa estar em HTTPS');
      }

      console.log('Requesting microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log('Microphone access granted');
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('Audio chunk received:', event.data.size, 'bytes');
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        toast({
          title: "Erro na gravação",
          description: "Ocorreu um erro durante a gravação",
          variant: "destructive",
        });
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log('Recording started');
      
      toast({
        title: "Gravando",
        description: "Fale agora...",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      
      let errorMessage = "Não foi possível acessar o microfone";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Permissão negada. Permita o acesso ao microfone nas configurações do navegador";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "Nenhum microfone encontrado no dispositivo";
        } else if (error.name === 'NotReadableError') {
          errorMessage = "Microfone está sendo usado por outro aplicativo";
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopRecording = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current || !isRecording) {
        reject(new Error('Not recording'));
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        console.log('Recording stopped');
        setIsRecording(false);
        setIsProcessing(true);

        try {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          console.log('Audio blob created:', audioBlob.size, 'bytes');
          
          // Convert blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result?.toString().split(',')[1];
            
            if (!base64Audio) {
              throw new Error('Failed to convert audio to base64');
            }

            console.log('Sending audio to transcription service...');
            
            // Send to edge function for transcription
            const { data, error } = await supabase.functions.invoke('voice-to-text', {
              body: { audio: base64Audio }
            });

            console.log('Transcription response:', data, error);
            setIsProcessing(false);

            if (error) {
              throw error;
            }

            if (data?.text) {
              console.log('Transcription successful:', data.text);
              toast({
                title: "Sucesso",
                description: "Áudio transcrito com sucesso!",
              });
              resolve(data.text);
            } else {
              throw new Error('No transcription received');
            }
          };

          reader.onerror = () => {
            setIsProcessing(false);
            reject(new Error('Failed to read audio file'));
          };

          // Stop all tracks
          mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        } catch (error) {
          setIsProcessing(false);
          console.error('Error processing audio:', error);
          toast({
            title: "Erro",
            description: error instanceof Error ? error.message : "Não foi possível transcrever o áudio",
            variant: "destructive",
          });
          reject(error);
        }
      };

      mediaRecorderRef.current.stop();
    });
  };

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
  };
};
