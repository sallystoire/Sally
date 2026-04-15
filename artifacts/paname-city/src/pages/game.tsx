import { useState } from "react";
import { useGetMyKingdom, useUpgradeBuilding, getGetMyKingdomQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ResourceBar } from "@/components/game/ResourceBar";
import { BottomNav } from "@/components/layout/BottomNav";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const buildingEmojis: Record<string, string> = {
  townhall: "🏰",
  goldmine: "⛏️",
  farm: "🌾",
  lumbermill: "🪵",
  quarry: "⛰️",
  barracks: "⚔️",
  cannon: "🔫",
  wall: "🧱",
};

const buildingNames: Record<string, string> = {
  townhall: "Hôtel de Ville",
  goldmine: "Mine d'Or",
  farm: "Ferme",
  lumbermill: "Scierie",
  quarry: "Carrière",
  barracks: "Caserne",
  cannon: "Canon",
  wall: "Rempart",
};

export default function Game() {
  const { data: kingdom, isLoading } = useGetMyKingdom();
  const upgradeMutation = useUpgradeBuilding();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);

  if (isLoading) return <div className="min-h-screen bg-green-800 flex items-center justify-center font-medieval text-white">Chargement du Royaume...</div>;
  if (!kingdom) return <div className="min-h-screen bg-green-800 flex items-center justify-center font-medieval text-white">Royaume introuvable.</div>;

  const handleUpgrade = () => {
    if (!selectedBuilding) return;

    upgradeMutation.mutate(
      { buildingId: selectedBuilding.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMyKingdomQueryKey() });
          toast({
            title: "Bâtiment amélioré !",
            description: `${buildingNames[selectedBuilding.type]} est maintenant niveau ${selectedBuilding.level + 1}`,
          });
          setSelectedBuilding(null);
        },
        onError: (err: any) => {
          toast({
            title: "Erreur d'amélioration",
            description: err.message || "Ressources insuffisantes ou erreur serveur.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-green-700 pb-20 pt-16 px-4">
      <ResourceBar />

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-10 gap-1 bg-green-600 p-2 rounded-xl shadow-2xl border-4 border-green-800 relative aspect-square">
          {/* 10x10 Grid Overlay */}
          {Array.from({ length: 100 }).map((_, i) => (
            <div key={i} className="w-full h-full border border-green-700/30 rounded-sm" />
          ))}

          {/* Buildings */}
          {kingdom.buildings.map((b: any) => (
            <motion.div
              key={b.id}
              style={{
                gridColumnStart: b.positionX + 1,
                gridRowStart: b.positionY + 1,
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedBuilding(b)}
              className="relative cursor-pointer z-10 flex items-center justify-center bg-card/40 rounded-md border border-card-border shadow-md"
              data-testid={`building-${b.type}-${b.id}`}
            >
              <span className="text-3xl md:text-4xl">{buildingEmojis[b.type] || "🏠"}</span>
              <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold px-1 rounded-sm border border-primary-border">
                {b.level}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Upgrade Modal */}
      <Dialog open={!!selectedBuilding} onOpenChange={(open) => !open && setSelectedBuilding(null)}>
        <DialogContent className="font-medieval bg-card border-card-border">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">
              {selectedBuilding && buildingNames[selectedBuilding.type]}
            </DialogTitle>
          </DialogHeader>
          {selectedBuilding && (
            <div className="py-4 text-center">
              <div className="text-6xl mb-4">{buildingEmojis[selectedBuilding.type]}</div>
              <p className="text-lg">Niveau actuel: <span className="text-primary">{selectedBuilding.level}</span></p>
              <p className="mt-2 text-muted-foreground">Voulez-vous améliorer ce bâtiment ?</p>
            </div>
          )}
          <DialogFooter className="sm:justify-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setSelectedBuilding(null)}
              className="flex-1"
            >
              ANNULER
            </Button>
            <Button
              onClick={handleUpgrade}
              disabled={upgradeMutation.isPending}
              className="flex-1 border-b-4 border-primary-border"
              data-testid="button-confirm-upgrade"
            >
              AMÉLIORER
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
