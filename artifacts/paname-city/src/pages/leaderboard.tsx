import { useListKingdoms } from "@workspace/api-client-react";
import { ResourceBar } from "@/components/game/ResourceBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Leaderboard() {
  const { data: kingdoms, isLoading } = useListKingdoms();

  const sortedKingdoms = kingdoms?.slice().sort((a: any, b: any) => b.trophies - a.trophies);

  if (isLoading) return <div className="min-h-screen bg-green-700 flex items-center justify-center font-medieval text-white">Récupération des champions...</div>;

  return (
    <div className="min-h-screen bg-green-700 pb-20 pt-16 px-4">
      <ResourceBar />
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-medieval text-primary text-center my-6 drop-shadow-md">CLASSEMENT</h1>
        
        <div className="bg-card/90 border-4 border-card-border rounded-xl shadow-2xl overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary/20">
              <TableRow className="border-card-border font-medieval text-primary uppercase tracking-wider">
                <TableHead className="w-16 text-center">Rang</TableHead>
                <TableHead>Royaume</TableHead>
                <TableHead className="text-right">Trophées</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-medieval">
              {sortedKingdoms?.map((k: any, index: number) => (
                <TableRow key={k.id} className="border-card-border hover:bg-muted/50 transition-colors" data-testid={`leaderboard-row-${index}`}>
                  <TableCell className="text-center font-bold">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                  </TableCell>
                  <TableCell className="text-lg">{k.name}</TableCell>
                  <TableCell className="text-right text-primary font-bold">🏆 {k.trophies}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
