
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

const mockData = [
  { name: 'Jan', sales: 12000 },
  { name: 'Feb', sales: 19000 },
  { name: 'Mar', sales: 15000 },
  { name: 'Apr', sales: 25000 },
  { name: 'May', sales: 22000 },
  { name: 'Jun', sales: 30000 },
  { name: 'Jul', sales: 28000 },
  { name: 'Aug', sales: 35000 },
  { name: 'Sep', sales: 32000 },
  { name: 'Oct', sales: 38000 },
  { name: 'Nov', sales: 42000 },
  { name: 'Dec', sales: 45000 },
];

export function SalesChart() {
  return (
    <Card className="gshop-card">
      <CardHeader>
        <CardTitle>Sales Overview</CardTitle>
        <p className="text-sm text-muted-foreground">
          Monthly sales performance
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                tickLine={false}
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                tickLine={false}
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border border-border rounded-lg p-2 shadow-sm">
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-sm text-primary">
                          Sales: ${payload[0]?.value?.toLocaleString?.()}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
