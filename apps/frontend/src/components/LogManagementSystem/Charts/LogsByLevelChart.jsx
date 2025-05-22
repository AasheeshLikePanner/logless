import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import _ from "lodash";

// Default colors for standard log levels
const DEFAULT_LEVEL_COLORS = {
  error: "#ef4444",
  warn: "#f59e0b",
  info: "#3b82f6",
  debug: "#10b981",
  fatal: "#dc2626",
  success: "#22c55e"
};

export default function LogsByLevelChart({ logs, customColors = {}, showBasic = false }) {
  const logsByLevel = _.groupBy(logs, 'Level');
  
  const chartData = Object.entries(logsByLevel).map(([level, logs]) => ({
    level,
    count: logs.length
  }));
  
  // Get color for each level, respecting showBasic flag
  const getLevelColor = (level) => {
    
    if (showBasic) return DEFAULT_LEVEL_COLORS[level] || "#8884d8";
    return customColors[level] || DEFAULT_LEVEL_COLORS[level] || "#8884d8";
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
            <Tooltip 
              formatter={(value) => [value, 'Count']}
              labelFormatter={(label) => `Level: ${label}`}
            />
            <Bar dataKey="count" name="Count">
              {chartData.map((entry, index) => (
                <Bar 
                  key={`cell-${index}`} 
                  fill={getLevelColor(entry.level)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}