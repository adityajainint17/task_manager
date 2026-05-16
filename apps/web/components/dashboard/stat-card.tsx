import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <Card className="border-white/10 bg-card/70">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-4 flex items-end justify-between">
        <p className="text-3xl font-semibold">{value}</p>
        <div className="rounded-full bg-emerald-500/12 p-2 text-emerald-400">
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{hint}</p>
    </Card>
  );
}
