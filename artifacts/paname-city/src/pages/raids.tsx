import { useState } from "react";
import { useListKingdoms, useStartRaid, useGetMyRaids, getGetMyRaidsQueryKey, getGetMyKingdomQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ResourceBar } from "@/components/game/ResourceBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function Raids() {
  const { data: kingdoms, isLoading: isKingdomsLoading } = useListKingdoms();
  const { data: raids, isLoading: isRaidsLoading } = useGetMyRaids();
  const raidMutation = useStartRaid();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [raidResult, setRaidResult] = useState<any>(null);

  const handleAttack = (targetDiscordId: string, targetName: string) => {
    raidMutation.mutate(
      { data: { targetDiscordId } },
      {
        onSuccess: (result: any) => {
          setRaidResult(result);
          queryClient.invalidateQueries({ queryKey: getGetMyRaidsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetMyKingdomQueryKey() });
        },
        onError: (err: any) => {
          toast({
            title: "Erreur de raid",
            description: err.message || "Vous ne pouvez pas attaquer ce joueur.",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isKingdomsLoading || isRaidsLoading) {
    return <div className="min-h-screen bg-green-700 flex items-center justify-center font-medieval text-white">Préparation des troupes...</div>;
  }

  return (
    <div className="min-h-screen bg-green-700 pb-20 pt-16 px-4">
      <ResourceBar />
      
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-medieval text-primary text-center my-6 drop-shadow-md">EXPÉDITIONS</h1>
        
        {/* Available Targets */}
        <section>
          <h2 className="text-2xl font-medieval text-white mb-4">Joueurs disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kingdoms?.map((k: any) => (
              <Card key={k.id} className="bg-card border-card-border shadow-md" data-testid={`card-kingdom-${k.id}`}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xl font-medieval">{k.name}</span>
                    <span className="text-sm font-medieval text-primary flex items-center gap-1">
                      🏆 {k.trophies}
                    </span>
                  </div>
                  <Button 
                    className="font-medieval border-b-4 border-primary-border"
                    disabled={raidMutation.isPending}
                    onClick={() => handleAttack(k.owner.id, k.name)}
                    data-testid={`button-attack-${k.owner.id}`}
                  >
                    ATTAQUER
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Raid History */}
        <section>
          <h2 className="text-2xl font-medieval text-white mb-4">Historique des raids</h2>
          <div className="space-y-2">
            {raids?.map((raid: any) => (
              <Card key={raid.id} className="bg-card/90 border-card-border" data-testid={`card-raid-history-${raid.id}`}>
                <CardContent className="p-3 flex justify-between items-center text-sm font-medieval">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">{new Date(raid.createdAt).toLocaleDateString()}</span>
                    <span>Vers: {raid.target.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={raid.result === "victory" ? "text-green-600" : "text-red-600"}>
                      {raid.result === "victory" ? "VICTOIRE" : "DÉFAITE"}
                    </span>
                    <div className="flex items-center gap-1">
                      💰 {raid.stolenGold}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {/* Raid Result Modal */}
      <Dialog open={!!raidResult} onOpenChange={(open) => !open && setRaidResult(null)}>
        <DialogContent className="font-medieval bg-card border-card-border">
          <DialogHeader>
            <DialogTitle className={cn(
              "text-4xl text-center font-medieval",
              raidResult?.result === "victory" ? "text-green-600" : "text-red-600"
            )}>
              {raidResult?.result === "victory" ? "VICTOIRE !" : "DÉFAITE..."}
            </DialogTitle>
          </DialogHeader>
          {raidResult && (
            <div className="py-6 text-center space-y-4">
              <div className="text-6xl">{raidResult.result === "victory" ? "🏆" : "💀"}</div>
              <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
                  <span className="text-xl">💰</span>
                  <span className="text-lg font-bold text-primary">+{raidResult.stolenGold}</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
                  <span className="text-xl">🏆</span>
                  <span className="text-lg font-bold text-primary">+{raidResult.trophyChange}</span>
                </div>
              </div>
              <p className="text-lg mt-4">{raidResult.message}</p>
            </div>
          )}
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setRaidResult(null)} className="w-full font-medieval border-b-4 border-primary-border">
              RETOUR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}

// Helper function
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
