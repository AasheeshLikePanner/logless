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
  const logsByLevel = _.groupBy(logs, 'level');
  
  // Create chart data with color information for each level
  const chartData = Object.entries(logsByLevel).map(([level, logs]) => ({
    level,
    count: logs.length,
    fill: showBasic 
      ? DEFAULT_LEVEL_COLORS[level] || "#8884d8"
      : customColors[level] || DEFAULT_LEVEL_COLORS[level] || "#8884d8"
  }));
  
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
            {/* Use a single Bar component with custom shape */}
            <Bar 
              dataKey="count" 
              name="Count"
              shape={(props) => {
                const { fill, x, y, width, height } = props;
                return (
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={fill}
                    rx={4}  // Optional: rounded corners
                    ry={4}  // Optional: rounded corners
                  />
                );
              }}
            >
              {/* Add individual cell colors */}
              {chartData.map((entry, index) => (
                <cell 
                  key={`cell-${index}`}
                  fill={entry.fill}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}