
import React from 'react';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface AIBrainBreakdown {
  name: string;
  value: number;
  color: string;
}

interface AIBrainBreakdownChartProps {
  data: AIBrainBreakdown[];
}

const chartConfig = {
  aiBrain: {
    label: "AI Brain Analysis",
  },
};

const AIBrainBreakdownChart = ({ data }: AIBrainBreakdownChartProps) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-medium text-slate-900">{data.name}</p>
          <p className="text-sm text-slate-600">
            {data.value} {data.value === 1 ? 'item' : 'items'}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-slate-600">{entry.value}</span>
        </div>
      ))}
    </div>
  );

  // Show message if no data
  if (data.length === 0 || data.every(item => item.value === 0)) {
    return (
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">AI Brain Analysis</h3>
          <p className="text-sm text-slate-600">Extracted story elements</p>
        </div>
        <div className="h-[320px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-500 mb-2">No AI analysis data yet</p>
            <p className="text-sm text-slate-400">Start writing to see AI-extracted story elements</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">AI Brain Analysis</h3>
        <p className="text-sm text-slate-600">Extracted story elements</p>
      </div>
      <ChartContainer config={chartConfig} className="h-[320px]">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <ChartTooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ChartContainer>
    </Card>
  );
};

export default AIBrainBreakdownChart;
