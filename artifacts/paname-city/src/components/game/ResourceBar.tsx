import { useGetMyKingdom } from "@workspace/api-client-react";

export function ResourceBar() {
  const { data: kingdom } = useGetMyKingdom();

  if (!kingdom) return null;

  const resources = [
    { icon: "💰", value: kingdom.gold, label: "Gold" },
    { icon: "🪵", value: kingdom.wood, label: "Wood" },
    { icon: "⛰️", value: kingdom.stone, label: "Stone" },
    { icon: "🍖", value: kingdom.food, label: "Food" },
    { icon: "🏆", value: kingdom.trophies, label: "Trophies" },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 h-12 bg-sidebar/90 border-b border-sidebar-border flex items-center justify-around px-2 z-50 backdrop-blur-sm shadow-lg">
      {resources.map((res, i) => (
        <div key={i} className="flex items-center gap-1.5" data-testid={`resource-${res.label.toLowerCase()}`}>
          <span className="text-lg leading-none">{res.icon}</span>
          <span className="text-xs font-medieval font-bold text-primary truncate max-w-[60px]">
            {res.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
