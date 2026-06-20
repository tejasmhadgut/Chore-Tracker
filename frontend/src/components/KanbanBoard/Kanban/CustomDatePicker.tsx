import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { FaCalendarAlt } from "react-icons/fa";
import "./CustomDatePicker.css";

type CustomDatePickerProps = {
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
};

const CustomDatePicker = ({ selectedDate, setSelectedDate }: CustomDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });

  const handleChange = (date: Date | null) => {
    setSelectedDate(date);
    setIsOpen(false);
  };

  // Update picker position when button position changes or picker opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPickerPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type='button'
        className="flex items-center justify-center w-full px-3 py-2 text-slate-100 hover:text-cyan-400 bg-slate-800 hover:bg-slate-700 transition-colors"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
      >
        {selectedDate ? <FaCalendarAlt className="text-cyan-400 mr-1" /> : <FaCalendarAlt />}
        {selectedDate ? format(selectedDate, "dd-MMM") : ""}
      </button>

      {isOpen &&
        createPortal(
          <div
            className="fixed bg-slate-900 p-3 shadow-2xl rounded-lg z-50 border border-cyan-500/30 datepicker-container"
            style={{
              top: `${pickerPosition.top}px`,
              left: `${pickerPosition.left}px`,
            }}
          >
            <DatePicker
              selected={selectedDate}
              onChange={handleChange}
              inline
              calendarClassName="dark-datepicker"
            />
          </div>,
          document.body
        )}
    </div>
  );
};

export default CustomDatePicker;
