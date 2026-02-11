import { Layout } from "@/components/Layout";
import { useExercises } from "@/hooks/use-exercises";
import { usePerformanceHistory } from "@/hooks/use-performance";
import { useState } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { TrendingUp, Award } from "lucide-react";

export default function PerformancePage() {
  const { data: exercises } = useExercises();
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold uppercase tracking-wide">Performance Analytics</h1>
        <p className="text-muted-foreground">Track your progress over time.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-8">
         <Card className="w-full md:w-1/3">
            <CardHeader>
               <CardTitle>Select Movement</CardTitle>
            </CardHeader>
            <CardContent>
               <Select onValueChange={(val) => setSelectedExerciseId(parseInt(val))}>
                  <SelectTrigger>
                     <SelectValue placeholder="Choose an exercise..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                     {exercises?.map(ex => (
                        <SelectItem key={ex.id} value={ex.id.toString()}>{ex.name}</SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </CardContent>
         </Card>

         <div className="flex-1">
             {selectedExerciseId ? (
                <HistoryChart exerciseId={selectedExerciseId} />
             ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-border rounded-xl p-12 bg-secondary/5 text-muted-foreground">
                   Select an exercise to view progress history
                </div>
             )}
         </div>
      </div>
    </Layout>
  );
}

function HistoryChart({ exerciseId }: { exerciseId: number }) {
  const { data: history, isLoading } = usePerformanceHistory(exerciseId);

  // Process data for charts - sort by date
  const chartData = history
    ?.filter(log => log.weightLifted) // Only logs with weight
    ?.sort((a,b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
    ?.map(log => ({
       date: format(new Date(log.date!), "MMM dd"),
       weight: log.weightLifted
    }));
  
  const maxWeight = history?.reduce((max, log) => Math.max(max, log.weightLifted || 0), 0) || 0;

  if (isLoading) return <div className="h-64 animate-pulse bg-secondary/20 rounded-xl" />;
  if (!chartData || chartData.length === 0) return <div className="h-64 flex items-center justify-center">No data recorded for this exercise.</div>;

  return (
    <div className="space-y-6">
       <div className="grid grid-cols-2 gap-4">
          <Card className="bg-primary/10 border-primary/20">
             <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 bg-primary text-primary-foreground rounded-lg">
                   <Award className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-xs font-bold uppercase text-primary/80">Personal Record</p>
                   <p className="text-3xl font-display font-bold text-primary">{maxWeight} <span className="text-sm font-normal text-muted-foreground">lbs</span></p>
                </div>
             </CardContent>
          </Card>
          <Card className="bg-secondary/20">
             <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 bg-secondary text-secondary-foreground rounded-lg">
                   <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-xs font-bold uppercase text-muted-foreground">Sessions Tracked</p>
                   <p className="text-3xl font-display font-bold">{chartData.length}</p>
                </div>
             </CardContent>
          </Card>
       </div>

       <Card>
          <CardHeader>
             <CardTitle className="text-lg">Progress Over Time</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} lbs`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={{ r: 4, fill: "hsl(var(--primary))" }}
                        activeDot={{ r: 6 }}
                      />
                   </LineChart>
                </ResponsiveContainer>
             </div>
          </CardContent>
       </Card>
    </div>
  );
}
