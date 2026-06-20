import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    ChartOptions
} from 'chart.js';
import { UserContribution } from '../../services/AnalyticsService';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface ContributionPieChartProps {
    contributions: UserContribution[];
}

const ContributionPieChart: React.FC<ContributionPieChartProps> = ({ contributions }) => {
    // Generate colors for each user
    const generateColors = (count: number): string[] => {
        const colors = [
            '#8b5cf6', // violet
            '#f97316', // orange
            '#3b82f6', // blue
            '#10b981', // green
            '#ef4444', // red
            '#f59e0b', // amber
            '#06b6d4', // cyan
            '#ec4899', // pink
            '#6366f1', // indigo
            '#14b8a6', // teal
        ];

        const result: string[] = [];
        for (let i = 0; i < count; i++) {
            result.push(colors[i % colors.length]);
        }
        return result;
    };

    const data = {
        labels: contributions.map(c => `${c.firstName} ${c.lastName}`.trim() || c.userName),
        datasets: [
            {
                label: 'Tasks Completed',
                data: contributions.map(c => c.tasksCompleted),
                backgroundColor: generateColors(contributions.length),
                borderColor: '#ffffff',
                borderWidth: 2,
                hoverOffset: 10
            }
        ]
    };

    const options: ChartOptions<'pie'> = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    padding: 15,
                    font: {
                        size: 12
                    },
                    color: '#e2e8f0',
                    generateLabels: (chart) => {
                        const data = chart.data;
                        if (data.labels && data.datasets.length) {
                            return data.labels.map((label, i) => {
                                const dataset = data.datasets[0];
                                const value = dataset.data[i] as number;
                                const percentage = contributions[i].percentage.toFixed(1);
                                return {
                                    text: `${label}: ${value} (${percentage}%)`,
                                    fillStyle: Array.isArray(dataset.backgroundColor)
                                        ? dataset.backgroundColor[i]
                                        : dataset.backgroundColor,
                                    fontColor: '#e2e8f0',
                                    hidden: false,
                                    index: i
                                };
                            });
                        }
                        return [];
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed;
                        const contribution = contributions[context.dataIndex];
                        return [
                            `${label}`,
                            `Tasks: ${value}`,
                            `Percentage: ${contribution.percentage.toFixed(1)}%`,
                            `Rank: #${contribution.rank}`
                        ];
                    }
                }
            }
        }
    };

    if (contributions.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                No contribution data available
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 flex items-center justify-center">
                <Pie data={data} options={options} />
            </div>
        </div>
    );
};

export default ContributionPieChart;
