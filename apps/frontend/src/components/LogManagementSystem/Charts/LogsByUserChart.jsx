import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import _ from "lodash";

export default function LogsByUserChart({ logs }) {
  const logsByUser = _.groupBy(logs, log => log.context?.userId || 'unknown');
  
  const chartData = Object.entries(logsByUser).map(([userId, logs]) => ({
    userId: userId === 'unknown' ? 'No User' : userId,
    count: logs.length
  }));
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Logs by User</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="userId" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" name="Logs" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}