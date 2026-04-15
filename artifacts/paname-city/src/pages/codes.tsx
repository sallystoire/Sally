import { useState } from "react";
import { useRedeemCode } from "@workspace/api-client-react";
import { ResourceBar } from "@/components/game/ResourceBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Codes() {
  const [code, setCode] = useState("");
  const redeemMutation = useRedeemCode();
  const { toast } = useToast();

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    redeemMutation.mutate(
      { data: { code } },
      {
        onSuccess: (result: any) => {
          toast({
            title: "Code utilisé !",
            description: result.message || "Récompense ajoutée au royaume.",
          });
          setCode("");
        },
        onError: (err: any) => {
          toast({
            title: "Erreur",
            description: err.message || "Code invalide ou déjà utilisé.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-green-700 pb-20 pt-16 px-4">
      <ResourceBar />
      
      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-medieval text-primary text-center my-6 drop-shadow-md uppercase">PROMO CODES</h1>
        
        <Card className="bg-card border-4 border-card-border shadow-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl font-medieval text-center">Échangez votre code</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRedeem} className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="VOTRE CODE ICI"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="bg-muted/50 border-2 border-card-border h-12 text-xl font-medieval text-center uppercase tracking-widest placeholder:text-muted-foreground/30"
                  data-testid="input-promo-code"
                />
              </div>
              <Button 
                type="submit"
                className="w-full h-14 text-2xl font-medieval border-b-4 border-primary-border"
                disabled={redeemMutation.isPending || !code}
                data-testid="button-redeem-code"
              >
                VÉRIFIER
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-white/60 font-medieval text-sm">
          Suivez-nous sur les réseaux pour trouver de nouveaux codes !
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
