import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import _ from "lodash";

export default function LogsPerTimeChart({ logs }) {
  const logsByHour = _.groupBy(logs, log => {
    const date = new Date(log.timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
  });
  
  const chartData = Object.entries(logsByHour).map(([hour, logs]) => ({
    hour,
    count: logs.length,
    errors: logs.filter(log => log.level === 'error').length
  }));
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Logs Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#8884d8" name="All Logs" />
            <Line type="monotone" dataKey="errors" stroke="#ff0000" name="Errors" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}