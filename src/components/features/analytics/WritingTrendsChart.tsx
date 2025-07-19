
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ComposedChart, Bar, Area, AreaChart } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, parseISO } from 'date-fns';
import { WritingVelocityData } from '@/lib/analyticsUtils';

interface WritingTrendsChartProps {
  data: WritingVelocityData[];
}

const chartConfig = {
  dailyWords: {
    label: "Daily Words",
    color: "#06B6D4",
  },
  cumulativeWords: {
    label: "Total Words",
    color: "#8B5CF6",
  },
  hasActivity: {
    label: "Writing Day",
    color: "#10B981",
  }
};

const WritingTrendsChart = ({ data }: WritingTrendsChartProps) => {
  const [activeView, setActiveView] = useState('daily');

  const formattedData = data.map(item => ({
    ...item,
    displayDate: format(parseISO(item.date), 'MMM dd'),
    activityIndicator: item.hasActivity ? 1 : 0
  }));

  const totalDailyWords = data.reduce((sum, item) => sum + item.dailyWords, 0);
  const activeDays = data.filter(item => item.hasActivity).length;
  const avgDailyWords = activeDays > 0 ? Math.round(totalDailyWords / activeDays) : 0;

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Writing Velocity</h3>
        <p className="text-sm text-slate-600">Track your daily progress and cumulative growth</p>
        <div className="flex gap-4 mt-2 text-xs">
          <span className="text-slate-500">
            Active days: <span className="font-medium text-slate-700">{activeDays}/30</span>
          </span>
          <span className="text-slate-500">
            Avg per active day: <span className="font-medium text-slate-700">{avgDailyWords} words</span>
          </span>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">Daily Progress</TabsTrigger>
          <TabsTrigger value="cumulative">Cumulative Growth</TabsTrigger>
          <TabsTrigger value="combined">Combined View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily" className="mt-6">
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ComposedChart data={formattedData}>
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
              <ChartTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border rounded-lg shadow-lg">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-blue-600">
                          Daily: {data.dailyWords} words
                        </p>
                        {data.chapters > 0 && (
                          <p className="text-sm text-green-600">
                            Chapters: {data.chapters}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="dailyWords"
                fill="#06B6D4"
                radius={[2, 2, 0, 0]}
                opacity={0.8}
              />
              <Line
                type="monotone"
                dataKey="activityIndicator"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                strokeDasharray="2 2"
              />
            </ComposedChart>
          </ChartContainer>
        </TabsContent>
        
        <TabsContent value="cumulative" className="mt-6">
          <ChartContainer config={chartConfig} className="h-[300px]">
            <AreaChart data={formattedData}>
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
                dataKey="cumulativeWords"
                stroke="#8B5CF6"
                strokeWidth={2}
                fill="#8B5CF6"
                fillOpacity={0.1}
              />
            </AreaChart>
          </ChartContainer>
        </TabsContent>
        
        <TabsContent value="combined" className="mt-6">
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ComposedChart data={formattedData}>
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                yAxisId="daily"
                orientation="left"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                yAxisId="cumulative"
                orientation="right"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <ChartTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border rounded-lg shadow-lg">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-blue-600">
                          Daily: {data.dailyWords} words
                        </p>
                        <p className="text-sm text-purple-600">
                          Total: {data.cumulativeWords.toLocaleString()} words
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                yAxisId="daily"
                dataKey="dailyWords"
                fill="#06B6D4"
                radius={[2, 2, 0, 0]}
                opacity={0.6}
              />
              <Line
                yAxisId="cumulative"
                type="monotone"
                dataKey="cumulativeWords"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ChartContainer>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default WritingTrendsChart;
