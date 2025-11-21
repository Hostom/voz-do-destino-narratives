import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, PhoneCall, PhoneOff } from "lucide-react";
import { VoiceFlame } from "./VoiceFlame";

interface VoicePanelProps {
  isConnected: boolean;
  isMuted: boolean;
  connectedPeers: string[];
  speakingMap: Record<string, boolean>;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleMute: () => void;
  playerNames?: Record<string, string>;
}

export const VoicePanel = ({
  isConnected,
  isMuted,
  connectedPeers,
  speakingMap,
  onConnect,
  onDisconnect,
  onToggleMute,
  playerNames = {},
}: VoicePanelProps) => {
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
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Ativo
                  </>
                )}
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

        {/* Connected Peers List */}
        {isConnected && connectedPeers.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground font-medium">
              Conectados ({connectedPeers.length})
            </div>
            <div className="space-y-1">
              {connectedPeers.map((peerId) => (
                <div
                  key={peerId}
                  className="flex items-center gap-2 p-2 bg-background/50 rounded-md"
                >
                  <VoiceFlame userId={peerId} isSpeaking={speakingMap[peerId] || false} />
                  <span className="text-sm flex-1">
                    {playerNames[peerId] || "Jogador"}
                  </span>
                  {speakingMap[peerId] && (
                    <span className="text-xs text-primary animate-pulse">
                      Falando...
                    </span>
                  )}
                </div>
              ))}
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
