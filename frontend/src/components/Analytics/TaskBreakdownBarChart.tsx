import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions
} from 'chart.js';
import { TaskBreakdown } from '../../services/AnalyticsService';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface TaskBreakdownBarChartProps {
    taskBreakdown: TaskBreakdown;
}

const TaskBreakdownBarChart: React.FC<TaskBreakdownBarChartProps> = ({ taskBreakdown }) => {
    const data = {
        labels: ['Todo', 'In Progress', 'Done'],
        datasets: [
            {
                label: 'Number of Tasks',
                data: [
                    taskBreakdown.todoCount,
                    taskBreakdown.inProgressCount,
                    taskBreakdown.doneCount
                ],
                backgroundColor: [
                    '#ef4444', // red for Todo
                    '#f59e0b', // amber for In Progress
                    '#10b981'  // green for Done
                ],
                borderColor: [
                    '#dc2626',
                    '#d97706',
                    '#059669'
                ],
                borderWidth: 2,
                borderRadius: 8,
                hoverBackgroundColor: [
                    '#dc2626',
                    '#d97706',
                    '#059669'
                ]
            }
        ]
    };

    const options: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const value = context.parsed.y;
                        const percentage = context.dataIndex === 0
                            ? taskBreakdown.todoPercentage
                            : context.dataIndex === 1
                            ? taskBreakdown.inProgressPercentage
                            : taskBreakdown.donePercentage;
                        return [
                            `Tasks: ${value}`,
                            `Percentage: ${percentage.toFixed(1)}%`,
                            `Total Tasks: ${taskBreakdown.totalTasks}`
                        ];
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
                    font: {
                        size: 12,
                        weight: 'bold'
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
                    text: 'Number of Tasks',
                    font: {
                        size: 12,
                        weight: 'bold'
                    }
                }
            }
        }
    };

    if (taskBreakdown.totalTasks === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                No task data available
            </div>
        );
    }

    return (
        <div className="w-full">
            <div style={{ height: '300px' }}>
                <Bar data={data} options={options} />
            </div>

            {/* Stats Summary */}
            <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{taskBreakdown.todoCount}</div>
                    <div className="text-xs text-gray-600 mt-1">Todo</div>
                    <div className="text-xs font-semibold text-red-600">
                        {taskBreakdown.todoPercentage.toFixed(1)}%
                    </div>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">{taskBreakdown.inProgressCount}</div>
                    <div className="text-xs text-gray-600 mt-1">In Progress</div>
                    <div className="text-xs font-semibold text-amber-600">
                        {taskBreakdown.inProgressPercentage.toFixed(1)}%
                    </div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{taskBreakdown.doneCount}</div>
                    <div className="text-xs text-gray-600 mt-1">Done</div>
                    <div className="text-xs font-semibold text-green-600">
                        {taskBreakdown.donePercentage.toFixed(1)}%
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskBreakdownBarChart;
