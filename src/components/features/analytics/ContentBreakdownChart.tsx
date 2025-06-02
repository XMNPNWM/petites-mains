
import React from 'react';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { ContentBreakdown } from '@/lib/analyticsUtils';

interface ContentBreakdownChartProps {
  data: ContentBreakdown[];
}

const chartConfig = {
  content: {
    label: "Project Content",
  },
};

const ContentBreakdownChart = ({ data }: ContentBreakdownChartProps) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-medium text-slate-900">{data.name}</p>
          <p className="text-sm text-slate-600">
            {data.name === 'Written Content' ? `${data.value.toLocaleString()} words` : `${data.value} items`}
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

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Project Composition</h3>
        <p className="text-sm text-slate-600">Breakdown of your creative work</p>
      </div>
      <ChartContainer config={chartConfig} className="h-[250px]">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
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

export default ContentBreakdownChart;
