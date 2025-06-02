
import React from 'react';
import { Card } from '@/components/ui/card';
import { format, parseISO, getDay, startOfWeek, eachWeekOfInterval, startOfYear, endOfYear, eachDayOfInterval, addDays } from 'date-fns';
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

  // Create a proper year-long grid
  const now = new Date();
  const startDate = new Date(now.getFullYear(), 0, 1); // Start of current year
  const endDate = now;
  
  // Get all weeks in the year
  const weeks = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 0 });
  
  // Create a map for quick data lookup
  const dataMap = data.reduce((acc, day) => {
    acc[day.date] = day;
    return acc;
  }, {} as Record<string, HeatmapData>);

  // Generate month labels
  const monthLabels = [];
  for (let month = 0; month < 12; month++) {
    const monthDate = new Date(now.getFullYear(), month, 1);
    if (monthDate <= now) {
      monthLabels.push({
        name: format(monthDate, 'MMM'),
        position: month
      });
    }
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Writing Activity</h3>
        <p className="text-sm text-slate-600">Your writing patterns over the past year</p>
      </div>
      
      <div className="overflow-x-auto">
        <div className="flex items-start gap-3 min-w-[800px]">
          {/* Day labels */}
          <div className="flex flex-col gap-1 pt-6">
            {dayLabels.map((day, index) => (
              <div key={day} className="h-3 text-xs text-slate-500 flex items-center w-8">
                {index % 2 === 1 ? day : ''}
              </div>
            ))}
          </div>
          
          {/* Main heatmap container */}
          <div className="flex-1">
            {/* Month labels */}
            <div className="flex mb-2 h-4">
              {weeks.map((weekStart, weekIndex) => {
                const weekMonth = weekStart.getMonth();
                const isFirstWeekOfMonth = weekIndex === 0 || weeks[weekIndex - 1]?.getMonth() !== weekMonth;
                
                return (
                  <div key={weekIndex} className="flex-1 text-xs text-slate-500 text-left min-w-[11px]">
                    {isFirstWeekOfMonth && weekMonth < 12 ? format(weekStart, 'MMM') : ''}
                  </div>
                );
              })}
            </div>
            
            {/* Heatmap grid */}
            <div className="flex gap-1">
              {weeks.map((weekStart, weekIndex) => {
                const weekDays = eachDayOfInterval({
                  start: weekStart,
                  end: addDays(weekStart, 6)
                });

                return (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {weekDays.map((day, dayIndex) => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const dayData = dataMap[dateStr];
                      const isInFuture = day > now;
                      
                      return (
                        <div
                          key={dayIndex}
                          className="w-3 h-3 rounded-sm border border-slate-200 cursor-pointer hover:ring-1 hover:ring-purple-300"
                          style={{
                            backgroundColor: isInFuture 
                              ? '#f8fafc' 
                              : dayData 
                                ? getLevelColor(dayData.level) 
                                : getLevelColor(0)
                          }}
                          title={
                            isInFuture 
                              ? 'Future date'
                              : `${format(day, 'MMM dd, yyyy')}: ${dayData?.count || 0} activities`
                          }
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-between mt-6">
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
