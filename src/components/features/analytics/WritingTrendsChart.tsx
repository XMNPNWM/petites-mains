
import React from 'react';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { WritingVelocityData } from '@/lib/analyticsUtils';

interface WritingTrendsChartProps {
  data: WritingVelocityData[];
}

const chartConfig = {
  words: {
    label: "Words Written",
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
        <p className="text-sm text-slate-600">Words written over the last 30 days</p>
      </div>
      <ChartContainer config={chartConfig} className="h-[200px]">
        <AreaChart data={formattedData}>
          <defs>
            <linearGradient id="wordsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey="words"
            stroke="#8B5CF6"
            fillOpacity={1}
            fill="url(#wordsGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </Card>
  );
};

export default WritingTrendsChart;
