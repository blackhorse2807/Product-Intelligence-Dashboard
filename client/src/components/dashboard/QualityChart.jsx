import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const placeholderData = [
  { name: "Excellent", value: 12 },
  { name: "Good", value: 28 },
  { name: "Needs Work", value: 9 },
];

export function QualityChart({ data = placeholderData }) {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Listing Quality Distribution</CardTitle>
        <CardDescription>Placeholder chart — connect to /dashboard/quality-summary</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 20%)" />
            <XAxis dataKey="name" stroke="hsl(240 5% 64.9%)" />
            <YAxis stroke="hsl(240 5% 64.9%)" />
            <Tooltip contentStyle={{ background: "hsl(240 10% 6%)", border: "1px solid hsl(240 4% 16%)" }} />
            <Bar dataKey="value" fill="hsl(262 83% 58%)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
