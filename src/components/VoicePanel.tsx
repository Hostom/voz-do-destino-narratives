import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, PhoneCall, PhoneOff, Radio, Signal, SignalHigh, SignalLow, SignalZero } from "lucide-react";
import { VoiceFlame } from "./VoiceFlame";

interface VoicePanelProps {
  isConnected: boolean;
  isMuted: boolean;
  isPushToTalk: boolean;
  isPTTActive: boolean;
  connectedPeers: string[];
  speakingMap: Record<string, boolean>;
  peerStats: Record<string, { latency: number; packetLoss: number; quality: 'excellent' | 'good' | 'poor' | 'disconnected' } | undefined>;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleMute: () => void;
  onTogglePushToTalk: () => void;
  onVolumeChange: (peerId: string, volume: number) => void;
  playerNames?: Record<string, string>;
}

const getQualityIcon = (quality: string) => {
  switch (quality) {
    case 'excellent': return <SignalHigh className="w-3 h-3 text-green-500" />;
    case 'good': return <Signal className="w-3 h-3 text-yellow-500" />;
    case 'poor': return <SignalLow className="w-3 h-3 text-orange-500" />;
    default: return <SignalZero className="w-3 h-3 text-red-500" />;
  }
};

const getQualityColor = (quality: string) => {
  switch (quality) {
    case 'excellent': return 'bg-green-500/20 text-green-500 border-green-500/30';
    case 'good': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
    case 'poor': return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
    default: return 'bg-red-500/20 text-red-500 border-red-500/30';
  }
};

export const VoicePanel = ({
  isConnected,
  isMuted,
  isPushToTalk,
  isPTTActive,
  connectedPeers,
  speakingMap,
  peerStats,
  onConnect,
  onDisconnect,
  onToggleMute,
  onTogglePushToTalk,
  onVolumeChange,
  playerNames = {},
}: VoicePanelProps) => {
  const [peerVolumes, setPeerVolumes] = useState<Record<string, number>>({});

  const handleVolumeChange = (peerId: string, volume: number) => {
    setPeerVolumes((prev) => ({ ...prev, [peerId]: volume * 100 }));
    onVolumeChange(peerId, volume);
  };

  return (
    <Card className="bg-card/80 backdrop-blur border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <PhoneCall className="w-4 h-4 text-primary" />
          Círculo de Voz
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Connection Controls */}
        <div className="flex gap-2">
          {!isConnected ? (
            <Button 
              onClick={onConnect} 
              className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              size="sm"
            >
              <PhoneCall className="w-4 h-4 mr-2" />
              Entrar no Círculo
            </Button>
          ) : (
            <>
              <Button
                onClick={onToggleMute}
                variant={isMuted ? "destructive" : "default"}
                size="sm"
                className="flex-1"
              >
                {isMuted ? (
                  <>
                    <MicOff className="w-4 h-4 mr-2" />
                    Mutado
                  </>
                ) : isPushToTalk && isPTTActive ? (
                  <>
                    <Mic className="w-4 h-4 mr-2 animate-pulse" />
                    PTT
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Ativo
                  </>
                )}
              </Button>
              <Button
                onClick={onTogglePushToTalk}
                variant={isPushToTalk ? "default" : "outline"}
                size="sm"
                title={isPushToTalk ? "Desativar Push-to-Talk" : "Ativar Push-to-Talk"}
              >
                <Radio className="w-4 h-4" />
              </Button>
              <Button
                onClick={onDisconnect}
                variant="outline"
                size="sm"
              >
                <PhoneOff className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* PTT Hint */}
        {isConnected && isPushToTalk && (
          <div className="text-xs text-center text-muted-foreground bg-primary/10 rounded-md py-1 px-2">
            Segure <kbd className="px-1.5 py-0.5 bg-background rounded text-xs font-mono">ESPAÇO</kbd> para falar
          </div>
        )}

        {/* Connected Peers List */}
        {isConnected && connectedPeers.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground font-medium">
              Conectados ({connectedPeers.length})
            </div>
            <div className="space-y-3">
              {connectedPeers.map((peerId) => {
                const stats = peerStats[peerId];
                const quality = stats?.quality || 'good';
                const latency = Math.round(stats?.latency || 0);
                const packetLoss = stats?.packetLoss?.toFixed(1) || '0.0';

                return (
                  <div
                    key={peerId}
                    className="space-y-2 p-2 bg-background/50 rounded-md border border-border/50"
                  >
                    {/* Player Header */}
                    <div className="flex items-center gap-2">
                      <VoiceFlame userId={peerId} isSpeaking={speakingMap[peerId] || false} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {playerNames[peerId] || "Jogador"}
                          </span>
                          {speakingMap[peerId] && (
                            <Badge variant="outline" className="text-xs animate-pulse border-primary/50 text-primary">
                              Falando
                            </Badge>
                          )}
                        </div>
                      </div>
                      {getQualityIcon(quality)}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className={`text-xs ${getQualityColor(quality)}`}>
                        {latency}ms
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-muted/50">
                        {packetLoss}% perda
                      </Badge>
                    </div>

                    {/* Volume Control */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Volume</span>
                        <span>{Math.round(peerVolumes[peerId] || 100)}%</span>
                      </div>
                      <Slider
                        defaultValue={[100]}
                        max={100}
                        step={1}
                        onValueChange={(value) => handleVolumeChange(peerId, value[0] / 100)}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Status */}
        {isConnected && connectedPeers.length === 0 && (
          <div className="text-xs text-center text-muted-foreground py-2">
            Aguardando outros jogadores...
          </div>
        )}
      </CardContent>
    </Card>
  );
};
