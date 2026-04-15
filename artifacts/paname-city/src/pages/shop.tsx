import { useGetShopItems, useBuyShopItem, getGetShopItemsQueryKey, getGetMyKingdomQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ResourceBar } from "@/components/game/ResourceBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Shop() {
  const { data: items, isLoading } = useGetShopItems();
  const buyMutation = useBuyShopItem();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleBuy = (itemId: number, itemName: string) => {
    buyMutation.mutate(
      { data: { itemId } },
      {
        onSuccess: (result: any) => {
          queryClient.invalidateQueries({ queryKey: getGetShopItemsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetMyKingdomQueryKey() });
          toast({
            title: "Achat réussi !",
            description: `Vous avez acheté ${itemName}.`,
          });
        },
        onError: (err: any) => {
          toast({
            title: "Erreur d'achat",
            description: err.message || "Fonds insuffisants ou erreur serveur.",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoading) return <div className="min-h-screen bg-green-700 flex items-center justify-center font-medieval text-white">Chargement du Bazar...</div>;

  return (
    <div className="min-h-screen bg-green-700 pb-20 pt-16 px-4">
      <ResourceBar />
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-medieval text-primary text-center my-6 drop-shadow-md">LE BAZAR</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items?.map((item: any) => (
            <Card key={item.id} className="bg-card border-card-border overflow-hidden shadow-lg" data-testid={`card-shop-item-${item.id}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-medieval">{item.name}</CardTitle>
                  <span className="text-3xl">📦</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground font-medieval">{item.description}</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xl">💰</span>
                  <span className="text-2xl font-medieval font-bold text-primary">{item.price.toLocaleString()}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full font-medieval border-b-4 border-primary-border"
                  disabled={buyMutation.isPending}
                  onClick={() => handleBuy(item.id, item.name)}
                  data-testid={`button-buy-${item.id}`}
                >
                  ACHETER
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
