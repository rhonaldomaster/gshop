'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Mock data - in production this would come from API
const mockData = [
  { date: '2024-01-01', followers: 1200 },
  { date: '2024-01-02', followers: 1250 },
  { date: '2024-01-03', followers: 1180 },
  { date: '2024-01-04', followers: 1320 },
  { date: '2024-01-05', followers: 1400 },
  { date: '2024-01-06', followers: 1450 },
  { date: '2024-01-07', followers: 1520 },
]

export default function FollowerGrowth() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={mockData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          labelFormatter={(value) => new Date(value).toLocaleDateString()}
          formatter={(value, name) => [value, 'Followers']}
        />
        <Line
          type="monotone"
          dataKey="followers"
          stroke="#22c55e"
          strokeWidth={2}
          dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}