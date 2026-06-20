import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
    ChartOptions
} from 'chart.js';
import { DayOfWeekStats } from '../../services/AnalyticsService';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface DayOfWeekChartProps {
    dayStats: DayOfWeekStats[];
}

const DayOfWeekChart: React.FC<DayOfWeekChartProps> = ({ dayStats }) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Ensure we have data for all 7 days
    const sortedData = days.map(day => {
        const found = dayStats.find(stat => stat.dayOfWeek === day);
        return found ? found.completionCount : 0;
    });

    const data = {
        labels: days,
        datasets: [
            {
                label: 'Tasks Completed',
                data: sortedData,
                backgroundColor: 'rgba(6, 182, 212, 0.6)',
                borderColor: 'rgb(6, 182, 212)',
                borderWidth: 2,
                borderRadius: 6,
                hoverBackgroundColor: 'rgba(6, 182, 212, 0.8)',
            }
        ]
    };

    const options: ChartOptions<'bar'> = {
        indexAxis: 'x',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                display: true,
                labels: {
                    color: '#e5e7eb',
                    font: { size: 12 }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#e5e7eb',
                bodyColor: '#e5e7eb',
                borderColor: 'rgb(6, 182, 212)',
                borderWidth: 1
            }
        },
        scales: {
            y: {
                ticks: {
                    color: '#9ca3af',
                    font: { size: 11 }
                },
                grid: {
                    color: 'rgba(148, 163, 184, 0.1)'
                }
            },
            x: {
                ticks: {
                    color: '#9ca3af',
                    font: { size: 11 }
                },
                grid: {
                    color: 'rgba(148, 163, 184, 0.1)'
                }
            }
        }
    };

    return <Bar data={data} options={options} />;
};

export default DayOfWeekChart;
