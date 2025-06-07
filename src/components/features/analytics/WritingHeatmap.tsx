
import React from 'react';
import { Card } from '@/components/ui/card';
import { format, parseISO, eachWeekOfInterval, startOfYear, eachDayOfInterval, addDays } from 'date-fns';
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
  
  // Get all weeks in the year, starting from Sunday
  const weeks = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 0 });
  
  // Create a map for quick data lookup
  const dataMap = data.reduce((acc, day) => {
    acc[day.date] = day;
    return acc;
  }, {} as Record<string, HeatmapData>);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Writing Activity</h3>
        <p className="text-sm text-slate-600">Your writing patterns over the past year</p>
      </div>
      
      <div className="w-full">
        <div className="flex items-start gap-3">
          {/* Day labels with proper spacing to align with boxes */}
          <div className="flex flex-col gap-[2px] pt-5 flex-shrink-0 w-8">
            {dayLabels.map((day, index) => (
              <div key={day} className="h-[11px] text-[10px] text-slate-500 flex items-center justify-start leading-none">
                {index % 2 === 1 ? day : ''}
              </div>
            ))}
          </div>
          
          {/* Main heatmap container */}
          <div className="flex-1 min-w-0">
            {/* Month labels with perfect alignment */}
            <div className="flex mb-1 h-4">
              {weeks.map((weekStart, weekIndex) => {
                const weekMonth = weekStart.getMonth();
                const prevWeekMonth = weekIndex > 0 ? weeks[weekIndex - 1]?.getMonth() : -1;
                const isFirstWeekOfMonth = weekIndex === 0 || prevWeekMonth !== weekMonth;
                
                return (
                  <div 
                    key={weekIndex} 
                    className="text-[10px] text-slate-500 flex-1 text-left leading-none"
                  >
                    {isFirstWeekOfMonth && weekMonth < 12 ? format(weekStart, 'MMM') : ''}
                  </div>
                );
              })}
            </div>
            
            {/* Heatmap grid with perfect distribution and alignment */}
            <div className="flex gap-[2px]">
              {weeks.map((weekStart, weekIndex) => {
                const weekDays = eachDayOfInterval({
                  start: weekStart,
                  end: addDays(weekStart, 6)
                });

                return (
                  <div key={weekIndex} className="flex flex-col gap-[2px] flex-1">
                    {weekDays.map((day, dayIndex) => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const dayData = dataMap[dateStr];
                      const isInFuture = day > now;
                      
                      return (
                        <div
                          key={dayIndex}
                          className="w-full h-[11px] rounded-sm border border-slate-200 cursor-pointer hover:ring-1 hover:ring-purple-300"
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
