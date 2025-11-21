import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RealtimeChannel } from "@supabase/supabase-js";

interface PeerConnection {
  connection: RTCPeerConnection;
  stream?: MediaStream;
  volume: number;
  stats?: {
    latency: number;
    packetLoss: number;
    quality: 'excellent' | 'good' | 'poor' | 'disconnected';
  };
}

interface VoiceChatConfig {
  roomId: string;
  userId: string;
  userName: string;
}

interface SignalingMessage {
  type: "join" | "leave" | "offer" | "answer" | "ice-candidate" | "voice-state";
  from: string;
  to?: string;
  userName: string;
  payload?: any;
}

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

// VAD Configuration
const VAD_THRESHOLD = 0.02; // RMS threshold for speech detection
const VAD_SAMPLE_SIZE = 2048;
const SILENCE_DURATION_MS = 500;

export const useVoiceChat = ({ roomId, userId, userName }: VoiceChatConfig) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPushToTalk, setIsPushToTalk] = useState(false);
  const [isPTTActive, setIsPTTActive] = useState(false);
  const [speakingMap, setSpeakingMap] = useState<Record<string, boolean>>({});
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [peerStats, setPeerStats] = useState<Record<string, PeerConnection['stats']>>({});
  
  const { toast } = useToast();
  
  // Refs for persistent data
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingRef = useRef(false);

  // Initialize microphone and VAD
  const initializeMicrophone = async () => {
    try {
      console.log("[VoiceChat] Requesting microphone access...");
      console.log("[VoiceChat] Navigator.mediaDevices available:", !!navigator.mediaDevices);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia não suportado neste navegador");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      });

      localStreamRef.current = stream;
      console.log("[VoiceChat] Microphone access granted, stream tracks:", stream.getTracks().length);

      // Setup VAD
      setupVAD(stream);

      return stream;
    } catch (error) {
      console.error("[VoiceChat] Error accessing microphone:", error);
      console.error("[VoiceChat] Error name:", error instanceof Error ? error.name : 'unknown');
      console.error("[VoiceChat] Error message:", error instanceof Error ? error.message : 'unknown');
      throw error;
    }
  };

  // Setup Voice Activity Detection
  const setupVAD = (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = VAD_SAMPLE_SIZE;
      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      console.log("[VoiceChat] VAD initialized");
      startVADMonitoring();
    } catch (error) {
      console.error("[VoiceChat] Error setting up VAD:", error);
    }
  };

  // Monitor voice activity
  const startVADMonitoring = () => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const checkAudioLevel = () => {
      if (!analyserRef.current || !isConnected) return;

      analyser.getByteFrequencyData(dataArray);

      // Calculate RMS
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = dataArray[i] / 255;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / dataArray.length);

      // PTT mode: only speak if space is held
      const shouldSpeak = isPushToTalk ? isPTTActive : rms > VAD_THRESHOLD;

      // State changed: speaking started
      if (shouldSpeak && !isSpeakingRef.current) {
        console.log("[VoiceChat] Speaking detected");
        isSpeakingRef.current = true;
        setSpeakingMap((prev) => ({ ...prev, [userId]: true }));
        broadcastVoiceState(true);

        // Clear silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      }

      // State changed: silence detected
      if (!shouldSpeak && isSpeakingRef.current) {
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            console.log("[VoiceChat] Silence detected");
            isSpeakingRef.current = false;
            setSpeakingMap((prev) => ({ ...prev, [userId]: false }));
            broadcastVoiceState(false);
            silenceTimerRef.current = null;
          }, SILENCE_DURATION_MS);
        }
      }

      requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();
  };

  // Broadcast voice state to all peers
  const broadcastVoiceState = (speaking: boolean) => {
    if (!channelRef.current) return;

    const message: SignalingMessage = {
      type: "voice-state",
      from: userId,
      userName,
      payload: { speaking },
    };

    channelRef.current.send({
      type: "broadcast",
      event: "signaling",
      payload: message,
    });
  };

  // Create peer connection
  const createPeerConnection = (peerId: string, peerName: string): RTCPeerConnection => {
    console.log(`[VoiceChat] Creating peer connection for ${peerName} (${peerId})`);

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
      console.log(`[VoiceChat] Added local tracks to peer ${peerId}`);
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log(`[VoiceChat] Received track from ${peerId}`, event.streams);
      
      const remoteStream = event.streams[0];
      
      // Create or update audio element
      let audioElement = document.getElementById(`audio-${peerId}`) as HTMLAudioElement;
      
      if (!audioElement) {
        audioElement = document.createElement("audio");
        audioElement.id = `audio-${peerId}`;
        audioElement.autoplay = true;
        document.body.appendChild(audioElement);
        console.log(`[VoiceChat] Created audio element for ${peerId}`);
      }

      audioElement.srcObject = remoteStream;
      audioElement.volume = 1.0; // Default volume

      // Store stream reference
      const existingPeer = peerConnectionsRef.current.get(peerId);
      if (existingPeer) {
        existingPeer.stream = remoteStream;
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        console.log(`[VoiceChat] Sending ICE candidate to ${peerId}`);
        
        const message: SignalingMessage = {
          type: "ice-candidate",
          from: userId,
          to: peerId,
          userName,
          payload: event.candidate.toJSON(),
        };

        channelRef.current.send({
          type: "broadcast",
          event: "signaling",
          payload: message,
        });
      }
    };

    // Handle connection state
    pc.onconnectionstatechange = () => {
      console.log(`[VoiceChat] Connection state with ${peerId}: ${pc.connectionState}`);
      
      if (pc.connectionState === "connected") {
        toast({
          title: "Conectado",
          description: `Conectado com ${peerName}`,
        });
      } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        console.log(`[VoiceChat] Connection lost with ${peerId}`);
        removePeer(peerId);
      }
    };

    peerConnectionsRef.current.set(peerId, { 
      connection: pc, 
      volume: 1.0,
      stats: {
        latency: 0,
        packetLoss: 0,
        quality: 'good'
      }
    });
    updateConnectedPeers();
    startStatsMonitoring(peerId, pc);

    return pc;
  };

  // Handle incoming offer
  const handleOffer = async (message: SignalingMessage) => {
    try {
      console.log(`[VoiceChat] Handling offer from ${message.from}`);

      let pc = peerConnectionsRef.current.get(message.from)?.connection;
      
      if (!pc) {
        pc = createPeerConnection(message.from, message.userName);
      }

      await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
      console.log(`[VoiceChat] Remote description set for ${message.from}`);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log(`[VoiceChat] Answer created for ${message.from}`);

      // Send answer
      const answerMessage: SignalingMessage = {
        type: "answer",
        from: userId,
        to: message.from,
        userName,
        payload: answer,
      };

      channelRef.current?.send({
        type: "broadcast",
        event: "signaling",
        payload: answerMessage,
      });
    } catch (error) {
      console.error("[VoiceChat] Error handling offer:", error);
    }
  };

  // Handle incoming answer
  const handleAnswer = async (message: SignalingMessage) => {
    try {
      console.log(`[VoiceChat] Handling answer from ${message.from}`);

      const peer = peerConnectionsRef.current.get(message.from);
      if (!peer) {
        console.warn(`[VoiceChat] No peer connection found for ${message.from}`);
        return;
      }

      await peer.connection.setRemoteDescription(new RTCSessionDescription(message.payload));
      console.log(`[VoiceChat] Remote description set for ${message.from}`);
    } catch (error) {
      console.error("[VoiceChat] Error handling answer:", error);
    }
  };

  // Handle ICE candidate
  const handleIceCandidate = async (message: SignalingMessage) => {
    try {
      const peer = peerConnectionsRef.current.get(message.from);
      if (!peer) {
        console.warn(`[VoiceChat] No peer connection for ICE candidate from ${message.from}`);
        return;
      }

      await peer.connection.addIceCandidate(new RTCIceCandidate(message.payload));
      console.log(`[VoiceChat] ICE candidate added for ${message.from}`);
    } catch (error) {
      console.error("[VoiceChat] Error handling ICE candidate:", error);
    }
  };

  // Handle voice state updates
  const handleVoiceState = (message: SignalingMessage) => {
    const { speaking } = message.payload;
    console.log(`[VoiceChat] ${message.userName} is ${speaking ? "speaking" : "silent"}`);
    
    setSpeakingMap((prev) => ({
      ...prev,
      [message.from]: speaking,
    }));
  };

  // Handle peer join
  const handlePeerJoin = async (message: SignalingMessage) => {
    // Don't connect to ourselves
    if (message.from === userId) return;

    console.log(`[VoiceChat] Peer joined: ${message.userName} (${message.from})`);

    try {
      const pc = createPeerConnection(message.from, message.userName);

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log(`[VoiceChat] Offer created for ${message.from}`);

      // Send offer
      const offerMessage: SignalingMessage = {
        type: "offer",
        from: userId,
        to: message.from,
        userName,
        payload: offer,
      };

      channelRef.current?.send({
        type: "broadcast",
        event: "signaling",
        payload: offerMessage,
      });
    } catch (error) {
      console.error("[VoiceChat] Error handling peer join:", error);
    }
  };

  // Handle peer leave
  const handlePeerLeave = (message: SignalingMessage) => {
    console.log(`[VoiceChat] Peer left: ${message.userName} (${message.from})`);
    removePeer(message.from);
  };

  // Remove peer connection
  const removePeer = (peerId: string) => {
    const peer = peerConnectionsRef.current.get(peerId);
    
    if (peer) {
      peer.connection.close();
      peerConnectionsRef.current.delete(peerId);
      
      // Remove audio element
      const audioElement = document.getElementById(`audio-${peerId}`);
      if (audioElement) {
        audioElement.remove();
      }

      // Remove from speaking map
      setSpeakingMap((prev) => {
        const newMap = { ...prev };
        delete newMap[peerId];
        return newMap;
      });

      updateConnectedPeers();
      console.log(`[VoiceChat] Removed peer ${peerId}`);
    }
  };

  // Update connected peers list
  const updateConnectedPeers = () => {
    const peers = Array.from(peerConnectionsRef.current.keys());
    setConnectedPeers(peers);
  };

  // Monitor connection stats
  const startStatsMonitoring = (peerId: string, pc: RTCPeerConnection) => {
    const interval = setInterval(async () => {
      if (!peerConnectionsRef.current.has(peerId)) {
        clearInterval(interval);
        return;
      }

      try {
        const stats = await pc.getStats();
        let latency = 0;
        let packetLoss = 0;

        stats.forEach((report) => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            latency = report.currentRoundTripTime ? report.currentRoundTripTime * 1000 : 0;
          }
          if (report.type === 'inbound-rtp' && report.kind === 'audio') {
            const lost = report.packetsLost || 0;
            const received = report.packetsReceived || 1;
            packetLoss = (lost / (lost + received)) * 100;
          }
        });

        const quality: PeerConnection['stats']['quality'] = 
          latency < 100 && packetLoss < 1 ? 'excellent' :
          latency < 200 && packetLoss < 3 ? 'good' :
          latency < 400 && packetLoss < 5 ? 'poor' : 'disconnected';

        const peer = peerConnectionsRef.current.get(peerId);
        if (peer) {
          peer.stats = { latency, packetLoss, quality };
          setPeerStats((prev) => ({
            ...prev,
            [peerId]: { latency, packetLoss, quality }
          }));
        }
      } catch (error) {
        console.error(`[VoiceChat] Error getting stats for ${peerId}:`, error);
      }
    }, 2000);
  };

  // Set volume for a peer
  const setPeerVolume = (peerId: string, volume: number) => {
    const peer = peerConnectionsRef.current.get(peerId);
    if (peer) {
      peer.volume = volume;
      const audioElement = document.getElementById(`audio-${peerId}`) as HTMLAudioElement;
      if (audioElement) {
        audioElement.volume = volume;
      }
    }
  };

  // Toggle push-to-talk mode
  const togglePushToTalk = () => {
    setIsPushToTalk((prev) => {
      const newValue = !prev;
      toast({
        title: newValue ? "Push-to-Talk Ativado" : "VAD Automático Ativado",
        description: newValue 
          ? "Segure ESPAÇO para falar" 
          : "Detecção automática de voz ativada",
      });
      return newValue;
    });
  };

  // Handle keyboard events for PTT
  useEffect(() => {
    if (!isPushToTalk || !isConnected) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsPTTActive(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPTTActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPushToTalk, isConnected]);

  // Connect to voice chat
  const connect = async () => {
    // Prevent multiple simultaneous connections
    if (isConnected) {
      console.log("[VoiceChat] Already connected, ignoring");
      return;
    }

    try {
      console.log("[VoiceChat] Connecting to voice chat...");

      // Initialize microphone
      await initializeMicrophone();

      // Setup signaling channel
      const channel = supabase.channel(`voice-signal:${roomId}`);

      // Handle signaling messages
      channel.on("broadcast", { event: "signaling" }, ({ payload }: { payload: SignalingMessage }) => {
        console.log("[VoiceChat] Received signaling message:", payload.type, "from:", payload.userName);

        // Ignore messages from ourselves
        if (payload.from === userId) return;

        // Only process messages meant for us or broadcasts
        if (payload.to && payload.to !== userId) return;

        switch (payload.type) {
          case "join":
            handlePeerJoin(payload);
            break;
          case "leave":
            handlePeerLeave(payload);
            break;
          case "offer":
            handleOffer(payload);
            break;
          case "answer":
            handleAnswer(payload);
            break;
          case "ice-candidate":
            handleIceCandidate(payload);
            break;
          case "voice-state":
            handleVoiceState(payload);
            break;
        }
      });

      await channel.subscribe();
      channelRef.current = channel;
      setIsConnected(true);

      console.log("[VoiceChat] Subscribed to signaling channel");

      // Announce our presence
      const joinMessage: SignalingMessage = {
        type: "join",
        from: userId,
        userName,
      };

      channel.send({
        type: "broadcast",
        event: "signaling",
        payload: joinMessage,
      });

      toast({
        title: "🎤 Círculo de Voz Ativado",
        description: "Você entrou no círculo de voz",
      });

    } catch (error) {
      console.error("[VoiceChat] Error connecting:", error);
      
      let errorMessage = "Não foi possível conectar ao chat de voz";
      let errorDetails = "";
      
      if (error instanceof Error) {
        errorDetails = error.message;
        if (error.name === "NotAllowedError") {
          errorMessage = "Permissão de microfone negada. Clique no ícone de cadeado/câmera na barra de endereço e permita o acesso ao microfone.";
        } else if (error.name === "NotFoundError") {
          errorMessage = "Microfone não encontrado. Verifique se há um microfone conectado ao dispositivo.";
        } else if (error.name === "NotReadableError") {
          errorMessage = "Microfone já está em uso por outro aplicativo";
        } else if (error.name === "OverconstrainedError") {
          errorMessage = "As configurações de áudio solicitadas não são suportadas";
        }
      }

      console.error("[VoiceChat] Error details:", errorDetails);

      toast({
        title: "Erro ao Conectar",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Disconnect from voice chat
  const disconnect = async () => {
    console.log("[VoiceChat] Disconnecting...");

    // Announce our departure
    if (channelRef.current) {
      const leaveMessage: SignalingMessage = {
        type: "leave",
        from: userId,
        userName,
      };

      channelRef.current.send({
        type: "broadcast",
        event: "signaling",
        payload: leaveMessage,
      });

      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach((peer, peerId) => {
      peer.connection.close();
      
      const audioElement = document.getElementById(`audio-${peerId}`);
      if (audioElement) {
        audioElement.remove();
      }
    });
    peerConnectionsRef.current.clear();

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Clear state
    setIsConnected(false);
    setSpeakingMap({});
    setConnectedPeers([]);
    isSpeakingRef.current = false;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    toast({
      title: "Desconectado",
      description: "Você saiu do círculo de voz",
    });

    console.log("[VoiceChat] Disconnected successfully");
  };

  // Toggle mute
  const toggleMute = () => {
    if (!localStreamRef.current) return;

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
      
      console.log(`[VoiceChat] Muted: ${!audioTrack.enabled}`);

      toast({
        title: audioTrack.enabled ? "Microfone Ativado" : "Microfone Mutado",
        description: audioTrack.enabled ? "Outros jogadores podem te ouvir" : "Você está em silêncio",
      });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, []);

  return {
    isConnected,
    isMuted,
    isPushToTalk,
    isPTTActive,
    speakingMap,
    connectedPeers,
    peerStats,
    connect,
    disconnect,
    toggleMute,
    togglePushToTalk,
    setPeerVolume,
  };
};
