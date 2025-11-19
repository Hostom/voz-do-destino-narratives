import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseTurnNotificationProps {
  isUserTurn: boolean;
  currentTurnCharacterName: string | null;
  characterName: string;
}

export const useTurnNotification = ({
  isUserTurn,
  currentTurnCharacterName,
  characterName,
}: UseTurnNotificationProps) => {
  const { toast } = useToast();
  const previousTurnRef = useRef<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element for notification sound
    if (!audioRef.current) {
      audioRef.current = new Audio();
      // Using a simple beep sound - you can replace this with a custom sound file
      audioRef.current.src = "data:audio/wav;base64,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";
    }

    // Check if turn has changed to current user
    if (isUserTurn && !previousTurnRef.current && currentTurnCharacterName) {
      // Play notification sound
      if (audioRef.current) {
        audioRef.current.play().catch((error) => {
          console.error("Error playing notification sound:", error);
        });
      }

      // Show toast notification
      toast({
        title: "🎯 É o seu turno!",
        description: `${characterName}, é hora de agir!`,
        duration: 5000,
      });

      // Visual notification (browser notification if permitted)
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("É o seu turno!", {
          body: `${characterName}, é hora de agir no combate!`,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
        });
      }
    }

    previousTurnRef.current = isUserTurn;
  }, [isUserTurn, currentTurnCharacterName, characterName, toast]);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return null;
};
