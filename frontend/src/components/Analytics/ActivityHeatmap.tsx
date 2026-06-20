import React from 'react';
import { ActivityHeatmap as ActivityHeatmapData } from '../../services/AnalyticsService';

interface ActivityHeatmapProps {
    heatmap: ActivityHeatmapData[];
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ heatmap }) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Find max completion count for color scaling
    const maxCompletions = Math.max(...heatmap.map(h => h.completionCount), 1);

    // Create a map for quick lookup
    const heatmapMap: { [key: string]: number } = {};
    heatmap.forEach(item => {
        const key = `${item.dayOfWeek}-${item.hour}`;
        heatmapMap[key] = item.completionCount;
    });

    // Get color intensity based on completion count
    const getColor = (count: number): string => {
        if (count === 0) return 'bg-gray-100';

        const intensity = count / maxCompletions;

        if (intensity <= 0.2) return 'bg-violet-200';
        if (intensity <= 0.4) return 'bg-violet-300';
        if (intensity <= 0.6) return 'bg-violet-400';
        if (intensity <= 0.8) return 'bg-violet-500';
        return 'bg-violet-600';
    };

    const formatHour = (hour: number): string => {
        if (hour === 0) return '12 AM';
        if (hour < 12) return `${hour} AM`;
        if (hour === 12) return '12 PM';
        return `${hour - 12} PM`;
    };

    if (heatmap.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                No activity data available
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto">
            <div className="min-w-max">
                {/* Header - Days of Week */}
                <div className="flex mb-2">
                    <div className="w-20 flex-shrink-0"></div>
                    {days.map((day, index) => (
                        <div
                            key={index}
                            className="flex-1 text-center font-semibold text-sm text-gray-700 px-1"
                            style={{ minWidth: '60px' }}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Heatmap Grid */}
                <div className="space-y-1">
                    {hours.map(hour => (
                        <div key={hour} className="flex items-center">
                            {/* Hour Label */}
                            <div className="w-20 flex-shrink-0 text-xs text-gray-600 pr-2 text-right">
                                {formatHour(hour)}
                            </div>

                            {/* Day Cells */}
                            {days.map((_, dayIndex) => {
                                const key = `${dayIndex}-${hour}`;
                                const count = heatmapMap[key] || 0;
                                const color = getColor(count);

                                return (
                                    <div
                                        key={dayIndex}
                                        className={`flex-1 ${color} rounded transition-all hover:scale-110 hover:shadow-md cursor-pointer group relative`}
                                        style={{
                                            minWidth: '60px',
                                            height: '24px',
                                            margin: '1px'
                                        }}
                                        title={`${days[dayIndex]} at ${formatHour(hour)}: ${count} task${count !== 1 ? 's' : ''}`}
                                    >
                                        {/* Tooltip on hover */}
                                        <div className="hidden group-hover:block absolute z-10 bg-gray-900 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                                            {count} task{count !== 1 ? 's' : ''}
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="mt-6 flex items-center justify-center gap-4">
                    <span className="text-sm text-gray-600">Less</span>
                    <div className="flex gap-1">
                        <div className="w-6 h-6 bg-gray-100 rounded"></div>
                        <div className="w-6 h-6 bg-violet-200 rounded"></div>
                        <div className="w-6 h-6 bg-violet-300 rounded"></div>
                        <div className="w-6 h-6 bg-violet-400 rounded"></div>
                        <div className="w-6 h-6 bg-violet-500 rounded"></div>
                        <div className="w-6 h-6 bg-violet-600 rounded"></div>
                    </div>
                    <span className="text-sm text-gray-600">More</span>
                </div>

                {/* Stats Summary */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-violet-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Most Active Day</div>
                        <div className="text-lg font-bold text-violet-600">
                            {(() => {
                                const dayTotals = days.map((_, dayIndex) => {
                                    const total = heatmap
                                        .filter(h => h.dayOfWeek === dayIndex)
                                        .reduce((sum, h) => sum + h.completionCount, 0);
                                    return { day: days[dayIndex], total };
                                });
                                const mostActive = dayTotals.reduce((max, current) =>
                                    current.total > max.total ? current : max
                                );
                                return mostActive.day;
                            })()}
                        </div>
                    </div>
                    <div className="bg-violet-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Most Active Hour</div>
                        <div className="text-lg font-bold text-violet-600">
                            {(() => {
                                const hourTotals = hours.map(hour => {
                                    const total = heatmap
                                        .filter(h => h.hour === hour)
                                        .reduce((sum, h) => sum + h.completionCount, 0);
                                    return { hour, total };
                                });
                                const mostActive = hourTotals.reduce((max, current) =>
                                    current.total > max.total ? current : max
                                );
                                return formatHour(mostActive.hour);
                            })()}
                        </div>
                    </div>
                    <div className="bg-violet-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Peak Activity</div>
                        <div className="text-lg font-bold text-violet-600">
                            {maxCompletions} tasks
                        </div>
                    </div>
                    <div className="bg-violet-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Total Data Points</div>
                        <div className="text-lg font-bold text-violet-600">
                            {heatmap.length}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityHeatmap;
