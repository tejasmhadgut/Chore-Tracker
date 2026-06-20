import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ChartOptions
} from 'chart.js';
import { TimelineData } from '../../services/AnalyticsService';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface TimelineChartProps {
    timeline: TimelineData[];
}

const TimelineChart: React.FC<TimelineChartProps> = ({ timeline }) => {
    // Extract all unique users from the timeline data
    const allUsers = new Set<string>();
    timeline.forEach(day => {
        Object.keys(day.userBreakdown).forEach(user => allUsers.add(user));
    });
    const users = Array.from(allUsers);

    // Generate colors for each user
    const userColors: { [key: string]: string } = {};
    const colors = [
        '#8b5cf6', // violet
        '#f97316', // orange
        '#3b82f6', // blue
        '#10b981', // green
        '#ef4444', // red
        '#f59e0b', // amber
        '#06b6d4', // cyan
        '#ec4899', // pink
    ];
    users.forEach((user, index) => {
        userColors[user] = colors[index % colors.length];
    });

    // Format dates for labels
    const labels = timeline.map(day => {
        const date = new Date(day.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    // Create dataset for each user
    const datasets = users.map(user => {
        const data = timeline.map(day => day.userBreakdown[user] || 0);
        return {
            label: user,
            data: data,
            borderColor: userColors[user],
            backgroundColor: userColors[user] + '20', // 20% opacity
            borderWidth: 2,
            tension: 0.4,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: userColors[user],
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
        };
    });

    // Add total completions line
    datasets.push({
        label: 'Total',
        data: timeline.map(day => day.totalCompletions),
        borderColor: '#1f2937',
        backgroundColor: '#1f293720',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#1f2937',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        borderDash: [5, 5]
    });

    const data = {
        labels,
        datasets
    };

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    padding: 15,
                    font: {
                        size: 12
                    },
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            },
            tooltip: {
                callbacks: {
                    title: function(context) {
                        const index = context[0].dataIndex;
                        const date = new Date(timeline[index].date);
                        return date.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        });
                    },
                    label: function(context) {
                        const label = context.dataset.label || '';
                        const value = context.parsed.y;
                        return `${label}: ${value} task${value !== 1 ? 's' : ''}`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                    font: {
                        size: 11
                    }
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                    font: {
                        size: 11
                    }
                },
                grid: {
                    color: '#f3f4f6'
                },
                title: {
                    display: true,
                    text: 'Tasks Completed',
                    font: {
                        size: 12,
                        weight: 'bold'
                    }
                }
            }
        }
    };

    if (timeline.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                No timeline data available
            </div>
        );
    }

    return (
        <div className="w-full" style={{ height: '400px' }}>
            <Line data={data} options={options} />
        </div>
    );
};

export default TimelineChart;
