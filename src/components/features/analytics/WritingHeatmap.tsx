
import React from 'react';
import { Card } from '@/components/ui/card';
import { format, parseISO, getDay, getWeek, startOfYear } from 'date-fns';
import { HeatmapData } from '@/lib/analyticsUtils';

interface WritingHeatmapProps {
  data: HeatmapData[];
}

const WritingHeatmap = ({ data }: WritingHeatmapProps) => {
  const getLevelColor = (level: number) => {
    switch (level) {
      case 0: return '#f1f5f9'; // slate-100
      case 1: return '#e2e8f0'; // slate-200
      case 2: return '#c084fc'; // purple-400
      case 3: return '#a855f7'; // purple-500
      case 4: return '#7c3aed'; // purple-600
      default: return '#f1f5f9';
    }
  };

  // Group data by weeks
  const weeks = data.reduce((acc, day) => {
    const date = parseISO(day.date);
    const weekNumber = getWeek(date);
    const dayOfWeek = getDay(date);
    
    if (!acc[weekNumber]) {
      acc[weekNumber] = new Array(7).fill(null);
    }
    acc[weekNumber][dayOfWeek] = day;
    return acc;
  }, {} as Record<number, (HeatmapData | null)[]>);

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Writing Activity</h3>
        <p className="text-sm text-slate-600">Your writing patterns over the past year</p>
      </div>
      
      <div className="overflow-x-auto">
        <div className="flex items-start gap-2 min-w-[800px]">
          {/* Day labels */}
          <div className="flex flex-col gap-1 pt-4">
            {dayLabels.map((day, index) => (
              <div key={day} className="h-3 text-xs text-slate-500 flex items-center">
                {index % 2 === 1 ? day : ''}
              </div>
            ))}
          </div>
          
          {/* Heatmap grid */}
          <div className="flex-1">
            {/* Month labels */}
            <div className="flex gap-1 mb-2 h-4">
              {monthLabels.map((month, index) => (
                <div key={month} className="text-xs text-slate-500 flex-1 text-center">
                  {index % 3 === 0 ? month : ''}
                </div>
              ))}
            </div>
            
            {/* Grid */}
            <div className="flex gap-1">
              {Object.entries(weeks).map(([weekNum, days]) => (
                <div key={weekNum} className="flex flex-col gap-1">
                  {days.map((day, dayIndex) => (
                    <div
                      key={`${weekNum}-${dayIndex}`}
                      className="w-3 h-3 rounded-sm border border-slate-200"
                      style={{
                        backgroundColor: day ? getLevelColor(day.level) : '#f1f5f9'
                      }}
                      title={day ? `${format(parseISO(day.date), 'MMM dd, yyyy')}: ${day.count} activities` : ''}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-slate-500">Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className="w-3 h-3 rounded-sm border border-slate-200"
                style={{ backgroundColor: getLevelColor(level) }}
              />
            ))}
          </div>
          <span className="text-xs text-slate-500">More</span>
        </div>
      </div>
    </Card>
  );
};

export default WritingHeatmap;
