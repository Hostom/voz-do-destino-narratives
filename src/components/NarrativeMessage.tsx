interface NarrativeMessageProps {
  role: "user" | "assistant";
  content: string;
  characterName?: string;
}

export const NarrativeMessage = ({ role, content, characterName }: NarrativeMessageProps) => {

  return (
    <div
      className={`mb-3 md:mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ${
        role === "assistant" ? "pr-2 md:pr-12" : "pl-2 md:pl-12"
      }`}
    >
      <div className="relative">
        <div
          className={`relative p-3 md:p-6 rounded-xl md:rounded-2xl shadow-lg backdrop-blur-sm transition-all duration-300 active:scale-[0.98] md:active:scale-100 ${
            role === "user"
              ? "bg-primary/10 border border-primary/20 ml-auto max-w-[95%] md:max-w-[85%]"
              : "bg-card/80 border border-border/50 mr-auto max-w-[95%] md:max-w-[90%]"
          }`}
        >
          <div className="flex items-start gap-2 md:gap-3">
            {role === "assistant" && (
              <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                <span className="text-primary font-bold text-base md:text-lg">🎲</span>
              </div>
            )}
            {role === "user" && characterName && (
              <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-secondary/50 flex items-center justify-center border border-border">
                <span className="text-foreground font-semibold text-xs md:text-sm">
                  {characterName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              {role === "user" && characterName && (
                <div className="mb-1 text-xs font-semibold text-muted-foreground truncate">
                  {characterName}
                </div>
              )}
              <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm md:text-base break-words">
                {content}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
