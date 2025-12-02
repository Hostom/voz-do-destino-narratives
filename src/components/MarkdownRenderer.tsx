import { useMemo } from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer = ({ content, className = "" }: MarkdownRendererProps) => {
  const rendered = useMemo(() => {
    let html = content;

    // Escape HTML first
    html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Bold **text** or __text__
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-primary">$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong class="font-bold text-primary">$1</strong>');

    // Italic *text* or _text_
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic text-accent-foreground">$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em class="italic text-accent-foreground">$1</em>');

    // Code `text`
    html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">$1</code>');

    // Strikethrough ~~text~~
    html = html.replace(/~~(.+?)~~/g, '<del class="line-through text-muted-foreground">$1</del>');

    // Dice rolls [1d20+5] or similar patterns
    html = html.replace(/\[(\d+d\d+(?:[+-]\d+)?)\]/g, 
      '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold">🎲 $1</span>'
    );

    // Damage indicators {10 damage} or {10 dano}
    html = html.replace(/\{(\d+)\s*(damage|dano|hp)\}/gi, 
      '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/20 text-destructive text-xs font-bold">💥 $1</span>'
    );

    // Healing indicators {+10 hp} or {+10 vida}
    html = html.replace(/\{\+(\d+)\s*(hp|vida|heal|cura)\}/gi, 
      '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 text-xs font-bold">💚 +$1</span>'
    );

    // Gold/currency indicators {100 gold} or {100 ouro}
    html = html.replace(/\{(\d+)\s*(gold|ouro|gp|moedas?)\}/gi, 
      '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-600 text-xs font-bold">💰 $1</span>'
    );

    // Success indicator [SUCESSO] or [SUCCESS]
    html = html.replace(/\[(SUCESSO|SUCCESS|PASSOU|PASSED)\]/gi, 
      '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 text-xs font-bold uppercase">✓ $1</span>'
    );

    // Failure indicator [FALHA] or [FAILURE]
    html = html.replace(/\[(FALHA|FAILURE|FALHOU|FAILED)\]/gi, 
      '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/20 text-destructive text-xs font-bold uppercase">✗ $1</span>'
    );

    // Critical success [CRÍTICO] or [CRITICAL]
    html = html.replace(/\[(CR[ÍI]TICO|CRITICAL|NAT\s*20)\]/gi, 
      '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500/30 to-amber-500/30 text-yellow-500 text-xs font-bold uppercase animate-pulse">⭐ $1</span>'
    );

    // Headers ### text
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-primary mt-3 mb-1">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-primary mt-4 mb-2">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-primary mt-4 mb-2">$1</h1>');

    // Horizontal rule ---
    html = html.replace(/^---$/gm, '<hr class="my-3 border-primary/30" />');

    // Blockquotes > text
    html = html.replace(/^&gt; (.+)$/gm, 
      '<blockquote class="border-l-4 border-primary/50 pl-3 py-1 my-2 italic text-muted-foreground bg-primary/5 rounded-r">$1</blockquote>'
    );

    // Lists - item
    html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');
    
    // Line breaks
    html = html.replace(/\n/g, '<br />');

    return html;
  }, [content]);

  return (
    <div 
      className={`markdown-content leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
};
