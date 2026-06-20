import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
    AnalyticsSummary,
    UserContribution,
    TimelineData,
    TaskBreakdown,
    ChoreTypeStats
} from '../../services/AnalyticsService';

// PDF Export
export const exportToPDF = async (elementId: string, filename: string): Promise<void> => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error('Element not found for PDF export');
        return;
    }

    try {
        // Temporarily hide export buttons for cleaner PDF
        const exportButtons = element.querySelectorAll('[data-export-buttons]');
        exportButtons.forEach(btn => {
            (btn as HTMLElement).style.display = 'none';
        });

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        // Restore export buttons
        exportButtons.forEach(btn => {
            (btn as HTMLElement).style.display = '';
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth - 20; // 10mm margin on each side
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 10; // 10mm top margin

        // Add first page
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - 20; // Subtract top and bottom margins

        // Add additional pages if needed
        while (heightLeft > 0) {
            position = heightLeft - imgHeight + 10;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight - 20;
        }

        pdf.save(filename);
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF. Please try again.');
    }
};

// CSV Export
export const exportToCSV = (
    summary: AnalyticsSummary,
    contributions: UserContribution[],
    timeline: TimelineData[],
    taskBreakdown: TaskBreakdown,
    choreTypes: ChoreTypeStats[],
    filename: string
): void => {
    try {
        let csvContent = 'ChoreTrack Analytics Report\n\n';

        // Summary Section
        csvContent += 'SUMMARY\n';
        csvContent += 'Metric,Value\n';
        csvContent += `Date Range,"${summary.startDate} to ${summary.endDate}"\n`;
        csvContent += `Total Tasks,${summary.totalTasks}\n`;
        csvContent += `Total Tasks Completed,${summary.totalTasksCompleted}\n`;
        csvContent += `Completion Rate,${summary.completionRate}%\n`;
        csvContent += `Active Members,${summary.activeMembers}\n`;
        csvContent += `Average Tasks Per Member,${summary.averageTasksPerMember}\n`;
        csvContent += `Top Performer,"${summary.topPerformer}"\n\n`;

        // User Contributions Section
        csvContent += 'USER CONTRIBUTIONS\n';
        csvContent += 'Rank,Name,Username,Tasks Completed,Percentage\n';
        contributions.forEach(contrib => {
            csvContent += `${contrib.rank},"${contrib.firstName} ${contrib.lastName}",${contrib.userName},${contrib.tasksCompleted},${contrib.percentage}%\n`;
        });
        csvContent += '\n';

        // Task Breakdown Section
        csvContent += 'TASK BREAKDOWN BY STATUS\n';
        csvContent += 'Status,Count,Percentage\n';
        csvContent += `Todo,${taskBreakdown.todoCount},${taskBreakdown.todoPercentage}%\n`;
        csvContent += `In Progress,${taskBreakdown.inProgressCount},${taskBreakdown.inProgressPercentage}%\n`;
        csvContent += `Done,${taskBreakdown.doneCount},${taskBreakdown.donePercentage}%\n`;
        csvContent += `Total,${taskBreakdown.totalTasks},100%\n\n`;

        // Timeline Data Section
        csvContent += 'COMPLETION TIMELINE\n';
        csvContent += 'Date,Total Completions,User Breakdown\n';
        timeline.forEach(day => {
            const userBreakdown = Object.entries(day.userBreakdown)
                .map(([user, count]) => `${user}:${count}`)
                .join('; ');
            csvContent += `${day.date},${day.totalCompletions},"${userBreakdown}"\n`;
        });
        csvContent += '\n';

        // Chore Types Section
        csvContent += 'CHORE TYPES STATISTICS\n';
        csvContent += 'Chore Name,Completion Count,Percentage,Last Completed,Most Frequent Completer\n';
        choreTypes.forEach(chore => {
            csvContent += `"${chore.choreName}",${chore.completionCount},${chore.percentage}%,${chore.lastCompleted},"${chore.mostFrequentCompleter}"\n`;
        });

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error generating CSV:', error);
        alert('Failed to generate CSV. Please try again.');
    }
};

// Helper function to format date for filename
export const getExportFilename = (prefix: string, extension: string): string => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    return `${prefix}_${dateStr}.${extension}`;
};
