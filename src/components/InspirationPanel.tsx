import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface InspirationPanelProps {
  hasInspiration: boolean;
}

export const InspirationPanel = ({ hasInspiration }: InspirationPanelProps) => {
  return (
    <Card className="border-accent/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          Inspiração
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {hasInspiration ? (
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-accent text-accent-foreground">
              <Sparkles className="h-3 w-3 mr-1" />
              Ativa
            </Badge>
            <p className="text-xs text-muted-foreground">
              Use para obter vantagem em um teste
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant="outline">Sem Inspiração</Badge>
            <p className="text-xs text-muted-foreground">
              Jogue bem para receber do GM
            </p>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground pt-2 border-t border-border/40">
          <p className="font-medium mb-1">Como funciona:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Concedida pelo GM por boa interpretação</li>
            <li>Use para ter vantagem em qualquer teste</li>
            <li>Só pode ter 1 inspiração por vez</li>
            <li>Consumida ao usar em um teste</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
