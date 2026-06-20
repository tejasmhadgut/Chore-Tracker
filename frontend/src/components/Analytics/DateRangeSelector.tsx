import React, { useState } from 'react';
import { DateRange } from '../../services/AnalyticsService';

export type PresetRange = 'last7' | 'last30' | 'last90' | 'custom';

interface DateRangeSelectorProps {
    dateRange: DateRange;
    selectedPreset: PresetRange;
    onChange: (dateRange: DateRange, preset: PresetRange) => void;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ dateRange, selectedPreset, onChange }) => {
    const [showCustomInputs, setShowCustomInputs] = useState(selectedPreset === 'custom');
    const [customStartDate, setCustomStartDate] = useState<string>(
        dateRange.startDate?.toISOString().split('T')[0] || ''
    );
    const [customEndDate, setCustomEndDate] = useState<string>(
        dateRange.endDate?.toISOString().split('T')[0] || ''
    );

    const handlePresetChange = (preset: PresetRange) => {
        setShowCustomInputs(preset === 'custom');

        if (preset !== 'custom') {
            const endDate = new Date();
            let startDate = new Date();

            switch (preset) {
                case 'last7':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case 'last30':
                    startDate.setDate(endDate.getDate() - 30);
                    break;
                case 'last90':
                    startDate.setDate(endDate.getDate() - 90);
                    break;
            }

            onChange({ startDate, endDate }, preset);
        } else {
            onChange(dateRange, preset);
        }
    };

    const handleCustomDateChange = () => {
        if (customStartDate && customEndDate) {
            const startDate = new Date(customStartDate);
            const endDate = new Date(customEndDate);

            if (endDate >= startDate) {
                onChange({ startDate, endDate }, 'custom');
            } else {
                alert('End date must be after start date');
            }
        }
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomStartDate(e.target.value);
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomEndDate(e.target.value);
    };

    return (
        <div className="space-y-4">
            {/* Preset Buttons */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => handlePresetChange('last7')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedPreset === 'last7'
                            ? 'bg-violet-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    Last 7 Days
                </button>
                <button
                    onClick={() => handlePresetChange('last30')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedPreset === 'last30'
                            ? 'bg-violet-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    Last 30 Days
                </button>
                <button
                    onClick={() => handlePresetChange('last90')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedPreset === 'last90'
                            ? 'bg-violet-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    Last 90 Days
                </button>
                <button
                    onClick={() => handlePresetChange('custom')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedPreset === 'custom'
                            ? 'bg-violet-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    Custom Range
                </button>
            </div>

            {/* Custom Date Inputs */}
            {showCustomInputs && (
                <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={customStartDate}
                            onChange={handleStartDateChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={customEndDate}
                            onChange={handleEndDateChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleCustomDateChange}
                            className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}

            {/* Current Range Display */}
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <span className="font-medium">Current Range:</span>{' '}
                {dateRange.startDate?.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                })}{' '}
                -{' '}
                {dateRange.endDate?.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                })}
            </div>
        </div>
    );
};

export default DateRangeSelector;
