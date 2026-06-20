import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import {
    getAnalyticsSummary,
    getUserContributions,
    getTimelineData,
    getTaskBreakdown,
    getActivityHeatmap,
    getDayOfWeekStats,
    getHourOfDayStats,
    getChoreTypeStats,
    AnalyticsSummary,
    UserContribution,
    TimelineData,
    TaskBreakdown,
    DayOfWeekStats,
    HourOfDayStats,
    ChoreTypeStats,
    DateRange
} from '../../services/AnalyticsService';
import { errorHandler } from '../../services/errorHandler';
import { AnalyticsDashboardSkeleton } from '../Common/Skeletons';
import DateRangeSelector, { PresetRange } from './DateRangeSelector';
import ContributionPieChart from './ContributionPieChart';
import TimelineChart from './TimelineChart';
import TaskBreakdownBarChart from './TaskBreakdownBarChart';
import ActivityHeatmap from './ActivityHeatmap';
import DayOfWeekChart from './DayOfWeekChart';
import HourOfDayChart from './HourOfDayChart';
import InsightCards from './InsightCards';
import { exportToPDF, exportToCSV, getExportFilename } from './ExportUtils';
import { startSignalRConnection, getConnection } from '../KanbanBoard/Kanban/utils/signalIR';

interface AnalyticsDashboardProps {
    groupId?: number;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ groupId: propGroupId }) => {
    const navigate = useNavigate();
    const { groupId: paramGroupId } = useParams<{ groupId: string }>();
    const groupId = propGroupId || (paramGroupId ? parseInt(paramGroupId) : null);

    // State for date range
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
        endDate: new Date()
    });
    const [selectedPreset, setSelectedPreset] = useState<PresetRange>('last30');

    // State for analytics data
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [contributions, setContributions] = useState<UserContribution[]>([]);
    const [timeline, setTimeline] = useState<TimelineData[]>([]);
    const [taskBreakdown, setTaskBreakdown] = useState<TaskBreakdown | null>(null);
    const [heatmap, setHeatmap] = useState<ActivityHeatmap[]>([]);
    const [dayStats, setDayStats] = useState<DayOfWeekStats[]>([]);
    const [hourStats, setHourStats] = useState<HourOfDayStats[]>([]);
    const [choreTypes, setChoreTypes] = useState<ChoreTypeStats[]>([]);

    // Loading and error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch all analytics data
    const fetchAnalyticsData = async () => {
        if (!groupId) {
            setError('Group ID is required');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [
                summaryData,
                contributionsData,
                timelineData,
                taskBreakdownData,
                heatmapData,
                dayStatsData,
                hourStatsData,
                choreTypesData
            ] = await Promise.all([
                getAnalyticsSummary(groupId, dateRange),
                getUserContributions(groupId, dateRange),
                getTimelineData(groupId, dateRange),
                getTaskBreakdown(groupId, dateRange),
                getActivityHeatmap(groupId, dateRange),
                getDayOfWeekStats(groupId, dateRange),
                getHourOfDayStats(groupId, dateRange),
                getChoreTypeStats(groupId, dateRange)
            ]);

            setSummary(summaryData);
            setContributions(contributionsData);
            setTimeline(timelineData);
            setTaskBreakdown(taskBreakdownData);
            setHeatmap(heatmapData);
            setDayStats(dayStatsData);
            setHourStats(hourStatsData);
            setChoreTypes(choreTypesData);
        } catch (err) {
            const message = errorHandler.handleError(err, {
                operation: 'fetching analytics data',
                groupId: groupId
            });
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalyticsData();
    }, [groupId, dateRange]);

    // SignalR real-time updates
    useEffect(() => {
        if (!groupId) return;

        const setupSignalR = async () => {
            try {
                await startSignalRConnection();
                const connection = getConnection();

                // Listen for chore updates
                connection.on('ChoreUpdated', (updatedChore: any) => {
                    console.log('Chore updated via SignalR:', updatedChore);
                    // Refresh analytics data when a chore is updated
                    if (updatedChore.groupId === groupId) {
                        fetchAnalyticsData();
                    }
                });

                // Listen for chore creation
                connection.on('ChoreCreated', (newChore: any) => {
                    console.log('Chore created via SignalR:', newChore);
                    if (newChore.groupId === groupId) {
                        fetchAnalyticsData();
                    }
                });

                // Listen for chore deletion
                connection.on('ChoreDeleted', (choreId: number, deletedGroupId: number) => {
                    console.log('Chore deleted via SignalR:', choreId);
                    if (deletedGroupId === groupId) {
                        fetchAnalyticsData();
                    }
                });
            } catch (error) {
                console.error('Error setting up SignalR for analytics:', error);
            }
        };

        setupSignalR();

        // Cleanup
        return () => {
            const connection = getConnection();
            connection.off('ChoreUpdated');
            connection.off('ChoreCreated');
            connection.off('ChoreDeleted');
        };
    }, [groupId]);

    const handleDateRangeChange = (newDateRange: DateRange, preset: PresetRange) => {
        setDateRange(newDateRange);
        setSelectedPreset(preset);
    };

    const handleExportPDF = async () => {
        const filename = getExportFilename('analytics_report', 'pdf');
        await exportToPDF('analytics-dashboard', filename);
    };

    const handleExportCSV = () => {
        if (!summary || !taskBreakdown) {
            alert('Analytics data is not loaded yet');
            return;
        }
        const filename = getExportFilename('analytics_report', 'csv');
        exportToCSV(summary, contributions, timeline, taskBreakdown, choreTypes, filename);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900/50 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <div className="h-10 bg-slate-700 rounded w-1/3 animate-pulse mb-4"></div>
                        <div className="h-4 bg-slate-700 rounded w-1/2 animate-pulse"></div>
                    </div>
                    <AnalyticsDashboardSkeleton />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-900/50 p-4 md:p-8 flex items-center justify-center">
                <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 max-w-md w-full">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertCircle className="w-6 h-6 text-red-400" />
                        <h3 className="text-xl font-semibold text-red-400">Analytics Error</h3>
                    </div>
                    <p className="text-gray-300 mb-6">{error}</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => fetchAnalyticsData()}
                            className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => window.history.back()}
                            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8">
            <div id="analytics-dashboard" className="max-w-7xl mx-auto">
                {/* Back Button */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-cyan-300 hover:text-cyan-200 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back</span>
                    </button>
                </div>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Analytics Dashboard</h1>
                    <p className="text-gray-400">Track your team's performance and productivity</p>
                </div>

                {/* Date Range Selector */}
                <div className="mb-6 bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700">
                    <h2 className="text-lg font-semibold mb-4 text-white">Select Date Range</h2>
                    <DateRangeSelector dateRange={dateRange} selectedPreset={selectedPreset} onChange={handleDateRangeChange} />
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 shadow-lg border border-slate-700 hover:border-slate-600 transition-all">
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Completions</div>
                            <div className="text-4xl font-bold text-cyan-400 mb-2">{summary.totalTasksCompleted}</div>
                            <div className="text-xs text-slate-500">of {summary.totalTasks} tasks</div>
                        </div>

                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 shadow-lg border border-slate-700 hover:border-slate-600 transition-all">
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Completion Rate</div>
                            <div className="text-4xl font-bold text-green-400 mb-2">{summary.completionRate}%</div>
                            <div className="text-xs text-slate-500">of group tasks</div>
                        </div>

                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 shadow-lg border border-slate-700 hover:border-slate-600 transition-all">
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Team Members</div>
                            <div className="text-4xl font-bold text-purple-400 mb-2">{summary.activeMembers}</div>
                            <div className="text-xs text-slate-500">active contributors</div>
                        </div>

                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 shadow-lg border border-slate-700 hover:border-slate-600 transition-all">
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Top Performer</div>
                            <div className="text-lg font-bold text-yellow-400 mb-2 truncate hover:text-clip" title={summary.topPerformer || 'N/A'}>
                                {summary.topPerformer || '—'}
                            </div>
                            <div className="text-xs text-slate-500">by points</div>
                        </div>
                    </div>
                )}

                {/* User Contributions Table */}
                {contributions.length > 0 && summary && (
                    <div className="bg-slate-800 rounded-lg p-6 shadow-lg mb-6 border border-slate-700">
                        <h2 className="text-xl font-semibold mb-4 text-white">Member Contributions Ranking</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-700">
                                        <th className="px-4 py-3 text-left text-slate-400 font-semibold">Rank</th>
                                        <th className="px-4 py-3 text-left text-slate-400 font-semibold">Member</th>
                                        <th className="px-4 py-3 text-right text-slate-400 font-semibold">Completions</th>
                                        <th className="px-4 py-3 text-right text-slate-400 font-semibold">Contribution</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {contributions.map((contrib) => (
                                        <tr key={contrib.userId} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-cyan-600/20 text-cyan-400 font-bold text-xs">
                                                    {contrib.rank}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={contrib.profilePictureUrl || '/default-avatar.jpeg'}
                                                        alt={contrib.firstName}
                                                        className="w-9 h-9 rounded-full object-cover border border-slate-600"
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="text-white font-medium text-sm">{contrib.firstName} {contrib.lastName}</div>
                                                        <div className="text-xs text-slate-500">@{contrib.userName}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="text-cyan-400 font-semibold">{contrib.tasksCompleted}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-20 bg-slate-700 rounded-full h-2">
                                                        <div
                                                            className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-2 rounded-full transition-all"
                                                            style={{ width: `${contrib.percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-yellow-400 font-bold text-sm w-12 text-right">{contrib.percentage}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* User Contributions Pie Chart */}
                    <div className="bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700 flex flex-col min-h-96">
                        <h2 className="text-xl font-semibold mb-4 text-white">Contribution Distribution</h2>
                        <div className="flex-1 flex items-center justify-center">
                            <ContributionPieChart contributions={contributions} />
                        </div>
                    </div>

                    {/* Task Breakdown Bar Chart */}
                    <div className="bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700 flex flex-col min-h-96">
                        <h2 className="text-xl font-semibold mb-4 text-white">Task Status Breakdown</h2>
                        <div className="flex-1 flex items-center justify-center">
                            {taskBreakdown && <TaskBreakdownBarChart taskBreakdown={taskBreakdown} />}
                        </div>
                    </div>
                </div>

                {/* Timeline Chart - Full Width */}
                <div className="bg-slate-800 rounded-lg p-6 shadow-lg mb-6 border border-slate-700">
                    <h2 className="text-xl font-semibold mb-4 text-white">Completion Timeline</h2>
                    <TimelineChart timeline={timeline} />
                </div>

                {/* Key Insights */}
                {summary && (
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-4 text-white">Key Insights</h2>
                        <InsightCards
                            dayStats={dayStats}
                            hourStats={hourStats}
                            totalTasksCompleted={summary.totalTasksCompleted}
                            completionRate={summary.completionRate}
                        />
                    </div>
                )}

                {/* Activity Patterns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Day of Week Stats */}
                    <div className="bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700">
                        <h2 className="text-xl font-semibold mb-4 text-white">Activity by Day of Week</h2>
                        {dayStats.length > 0 ? (
                            <DayOfWeekChart dayStats={dayStats} />
                        ) : (
                            <div className="text-gray-500 text-center py-8">No data available</div>
                        )}
                    </div>

                    {/* Hour of Day Stats */}
                    <div className="bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700">
                        <h2 className="text-xl font-semibold mb-4 text-white">Activity by Time of Day</h2>
                        {hourStats.length > 0 ? (
                            <HourOfDayChart hourStats={hourStats} />
                        ) : (
                            <div className="text-gray-500 text-center py-8">No data available</div>
                        )}
                    </div>
                </div>

                {/* Heatmap - Full Width */}
                <div className="bg-slate-800 rounded-lg p-6 shadow-lg mb-6 border border-slate-700">
                    <h2 className="text-xl font-semibold mb-4 text-white">Activity Heatmap</h2>
                    <p className="text-sm text-gray-400 mb-4">
                        See when your team is most active by day of week and time of day
                    </p>
                    <ActivityHeatmap heatmap={heatmap} />
                </div>

                {/* Chore Types Stats */}
                <div className="bg-slate-800 rounded-lg p-6 shadow-lg mb-6 border border-slate-700">
                    <h2 className="text-xl font-semibold mb-6 text-white">Most Completed Chore Types</h2>
                    {choreTypes.length > 0 ? (
                        <div className="space-y-5">
                            {choreTypes.slice(0, 5).map((chore, index) => {
                                const colors = [
                                    'from-violet-500/20 to-violet-600/20 border-violet-500/30',
                                    'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30',
                                    'from-blue-500/20 to-blue-600/20 border-blue-500/30',
                                    'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30',
                                    'from-orange-500/20 to-orange-600/20 border-orange-500/30'
                                ];
                                const barColors = [
                                    'bg-gradient-to-r from-violet-500 to-violet-600',
                                    'bg-gradient-to-r from-cyan-500 to-cyan-600',
                                    'bg-gradient-to-r from-blue-500 to-blue-600',
                                    'bg-gradient-to-r from-emerald-500 to-emerald-600',
                                    'bg-gradient-to-r from-orange-500 to-orange-600'
                                ];
                                const textColors = [
                                    'text-violet-400',
                                    'text-cyan-400',
                                    'text-blue-400',
                                    'text-emerald-400',
                                    'text-orange-400'
                                ];

                                return (
                                    <div key={index} className={`bg-gradient-to-r ${colors[index]} border rounded-lg p-4 hover:border-opacity-60 transition-all`}>
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <div className={`font-semibold ${textColors[index]} mb-1`}>{chore.choreName}</div>
                                                <div className="text-xs text-gray-400">
                                                    Most often by: <span className="text-gray-300 font-medium">{chore.mostFrequentCompleter}</span>
                                                </div>
                                            </div>
                                            <div className="text-right ml-4">
                                                <div className={`text-2xl font-bold ${textColors[index]}`}>{chore.completionCount}</div>
                                                <div className="text-xs text-gray-400">{chore.percentage}% of total</div>
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-700/50 rounded-full h-2 mt-3">
                                            <div
                                                className={`${barColors[index]} h-2 rounded-full transition-all duration-300`}
                                                style={{ width: `${chore.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-gray-500 text-center py-12">
                            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            No chore data available
                        </div>
                    )}
                </div>

                {/* Export Buttons */}
                <div className="flex justify-end gap-4" data-export-buttons>
                    <button
                        onClick={handleExportPDF}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export as PDF
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export as CSV
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
