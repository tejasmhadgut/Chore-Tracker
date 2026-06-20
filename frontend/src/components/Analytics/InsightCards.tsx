import React from 'react';
import { TrendingUp, TrendingDown, Flame, Calendar, Clock } from 'lucide-react';
import { DayOfWeekStats, HourOfDayStats } from '../../services/AnalyticsService';

interface InsightCardsProps {
    dayStats: DayOfWeekStats[];
    hourStats: HourOfDayStats[];
    totalTasksCompleted: number;
    completionRate: number;
}

const InsightCards: React.FC<InsightCardsProps> = ({
    dayStats,
    hourStats,
    totalTasksCompleted,
    completionRate
}) => {
    // Calculate busiest day
    const busiestDay = dayStats.length > 0
        ? dayStats.reduce((max, day) => day.completionCount > max.completionCount ? day : max)
        : null;

    // Calculate peak hour
    const peakHour = hourStats.length > 0
        ? hourStats.reduce((max, hour) => hour.completionCount > max.completionCount ? hour : max)
        : null;

    // Calculate trend (comparing first half to second half of data)
    const getTrendDirection = () => {
        if (dayStats.length < 2) return 'stable';
        const half = Math.floor(dayStats.length / 2);
        const firstHalf = dayStats.slice(0, half).reduce((sum, day) => sum + day.completionCount, 0);
        const secondHalf = dayStats.slice(half).reduce((sum, day) => sum + day.completionCount, 0);
        if (secondHalf > firstHalf) return 'up';
        if (secondHalf < firstHalf) return 'down';
        return 'stable';
    };

    const trend = getTrendDirection();

    const formatHour = (hour: number) => {
        return `${hour.toString().padStart(2, '0')}:00`;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busiest Day */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-5 shadow-lg border border-slate-700 hover:border-cyan-500/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <div className="text-sm text-gray-400 mb-1">Busiest Day</div>
                        <div className="text-2xl font-bold text-cyan-400">
                            {busiestDay?.dayOfWeek || 'N/A'}
                        </div>
                    </div>
                    <Calendar className="w-6 h-6 text-cyan-500/60" />
                </div>
                <div className="text-xs text-gray-500">
                    {busiestDay ? `${busiestDay.completionCount} tasks completed` : 'No data'}
                </div>
            </div>

            {/* Peak Hour */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-5 shadow-lg border border-slate-700 hover:border-blue-500/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <div className="text-sm text-gray-400 mb-1">Peak Activity Hour</div>
                        <div className="text-2xl font-bold text-blue-400">
                            {peakHour ? formatHour(peakHour.hour) : 'N/A'}
                        </div>
                    </div>
                    <Clock className="w-6 h-6 text-blue-500/60" />
                </div>
                <div className="text-xs text-gray-500">
                    {peakHour ? `${peakHour.completionCount} tasks completed` : 'No data'}
                </div>
            </div>

            {/* Trend */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-5 shadow-lg border border-slate-700 hover:border-orange-500/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <div className="text-sm text-gray-400 mb-1">Performance Trend</div>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            {trend === 'up' && (
                                <>
                                    <span className="text-green-400">Improving</span>
                                    <TrendingUp className="w-5 h-5 text-green-400" />
                                </>
                            )}
                            {trend === 'down' && (
                                <>
                                    <span className="text-orange-400">Declining</span>
                                    <TrendingDown className="w-5 h-5 text-orange-400" />
                                </>
                            )}
                            {trend === 'stable' && (
                                <span className="text-cyan-400">Stable</span>
                            )}
                        </div>
                    </div>
                    <Flame className="w-6 h-6 text-orange-500/60" />
                </div>
                <div className="text-xs text-gray-500">
                    {trend === 'up' && '📈 Keep up the momentum!'}
                    {trend === 'down' && '⚠️ Time to boost productivity'}
                    {trend === 'stable' && '➡️ Consistent performance'}
                </div>
            </div>
        </div>
    );
};

export default InsightCards;
