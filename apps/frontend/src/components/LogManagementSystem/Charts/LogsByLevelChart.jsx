import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import _ from "lodash";

export default function LogsByLevelChart({ logs }) {
  const logsByLevel = _.groupBy(logs, 'LogLevel');
  
  const chartData = Object.entries(logsByLevel).map(([level, logs]) => ({
    level,
    count: logs.length
  }));
  
  const colors = {
    ERROR: "#ef4444",
    WARN: "#f59e0b",
    INFO: "#3b82f6",
    DEBUG: "#10b981"
  };
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Logs by Level</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="level" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" name="Count">
              {chartData.map((entry, index) => (
                <Bar 
                  key={`cell-${index}`} 
                  fill={colors[entry.level] || "#8884d8"} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}