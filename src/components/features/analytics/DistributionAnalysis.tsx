
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { EnhancedAnalyticsData } from '@/lib/enhancedAnalyticsUtils';

interface DistributionAnalysisProps {
  analytics: EnhancedAnalyticsData;
}

const chartConfig = {
  count: {
    label: "Count",
    color: "#10B981",
  },
  percentage: {
    label: "Percentage",
    color: "#F59E0B",
  },
};

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const DistributionAnalysis = ({ analytics }: DistributionAnalysisProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Word Count Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Chapter Length Distribution</CardTitle>
          <p className="text-sm text-slate-600">Distribution of chapter word counts</p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px]">
            <BarChart data={analytics.wordCountDistribution}>
              <XAxis 
                dataKey="range"
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
                dataKey="count"
                fill="#10B981"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Status Progression */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Chapter Status Breakdown</CardTitle>
          <p className="text-sm text-slate-600">Current status of all chapters</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <PieChart>
                <Pie
                  data={analytics.statusProgression}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                >
                  {analytics.statusProgression.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {analytics.statusProgression.map((item, index) => (
              <div key={item.status} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-slate-600">
                  {item.status} ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DistributionAnalysis;
