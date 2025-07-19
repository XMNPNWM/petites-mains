
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedAnalyticsData } from '@/lib/enhancedAnalyticsUtils';

interface WritingPatternsChartProps {
  analytics: EnhancedAnalyticsData;
}

const chartConfig = {
  words: {
    label: "Words Written",
    color: "#8B5CF6",
  },
  sessions: {
    label: "Writing Sessions",
    color: "#06B6D4",
  },
};

const WritingPatternsChart = ({ analytics }: WritingPatternsChartProps) => {
  const [activeTab, setActiveTab] = useState('time');

  const timeData = analytics.timeOfDayData.map(item => ({
    hour: `${item.hour}:00`,
    words: item.words,
    sessions: item.sessions
  }));

  const dayData = analytics.dayOfWeekData.map(item => ({
    day: item.day.slice(0, 3), // Abbreviate day names
    words: item.words,
    sessions: item.sessions
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Writing Patterns Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="time">Time of Day</TabsTrigger>
            <TabsTrigger value="day">Day of Week</TabsTrigger>
          </TabsList>
          
          <TabsContent value="time" className="mt-6">
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-700">Words Written by Hour</h4>
              <p className="text-xs text-slate-500">Identify your most productive writing hours</p>
            </div>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={timeData}>
                <XAxis 
                  dataKey="hour"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="words"
                  fill="#8B5CF6"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </TabsContent>
          
          <TabsContent value="day" className="mt-6">
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-700">Words Written by Day</h4>
              <p className="text-xs text-slate-500">Discover your most productive days of the week</p>
            </div>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={dayData}>
                <XAxis 
                  dataKey="day"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="words"
                  fill="#06B6D4"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default WritingPatternsChart;
