
import React from 'react';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { WritingVelocityData } from '@/lib/analyticsUtils';

interface WritingTrendsChartProps {
  data: WritingVelocityData[];
}

const chartConfig = {
  cumulativeWords: {
    label: "Total Words",
    color: "#8B5CF6",
  },
};

const WritingTrendsChart = ({ data }: WritingTrendsChartProps) => {
  const formattedData = data.map(item => ({
    ...item,
    displayDate: format(parseISO(item.date), 'MMM dd')
  }));

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Writing Velocity</h3>
        <p className="text-sm text-slate-600">Cumulative words written over the last 30 days</p>
      </div>
      <ChartContainer config={chartConfig} className="h-[200px]">
        <LineChart data={formattedData}>
          <XAxis 
            dataKey="displayDate" 
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="cumulativeWords"
            stroke="#8B5CF6"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </Card>
  );
};

export default WritingTrendsChart;
