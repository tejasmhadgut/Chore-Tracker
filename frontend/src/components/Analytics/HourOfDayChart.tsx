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
import { HourOfDayStats } from '../../services/AnalyticsService';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface HourOfDayChartProps {
    hourStats: HourOfDayStats[];
}

const HourOfDayChart: React.FC<HourOfDayChartProps> = ({ hourStats }) => {
    // Create 24-hour labels
    const hours = Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0');
        return `${hour}:00`;
    });

    // Map data to hours
    const sortedData = hours.map((_, index) => {
        const found = hourStats.find(stat => stat.hour === index);
        return found ? found.completionCount : 0;
    });

    const data = {
        labels: hours,
        datasets: [
            {
                label: 'Tasks Completed',
                data: sortedData,
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 2,
                borderRadius: 4,
                hoverBackgroundColor: 'rgba(59, 130, 246, 0.8)',
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
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1,
                callbacks: {
                    label: function(context) {
                        return `Tasks: ${context.parsed.y}`;
                    }
                }
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
                    font: { size: 10 }
                },
                grid: {
                    color: 'rgba(148, 163, 184, 0.1)'
                }
            }
        }
    };

    return <Bar data={data} options={options} />;
};

export default HourOfDayChart;
