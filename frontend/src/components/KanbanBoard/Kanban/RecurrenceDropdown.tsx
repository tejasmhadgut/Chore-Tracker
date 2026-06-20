import { FiChevronDown } from "react-icons/fi";
import { motion } from "framer-motion";
import { Dispatch, SetStateAction, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { RecurrenceType } from "../Types/CardTypes";

const recurrenceOptions = [
  { label: "Daily", value: RecurrenceType.Daily },
  { label: "Weekly", value: RecurrenceType.Weekly },
  { label: "Monthly", value: RecurrenceType.Monthly },
  { label: "Custom", value: RecurrenceType.Custom },
  { label: "None", value: RecurrenceType.None }
];

type RecurrenceDropdownProps = {
  selectedRecurrence: RecurrenceType;
  setSelectedRecurrence: Dispatch<SetStateAction<RecurrenceType>>;
};

const RecurrenceDropdown = ({
  selectedRecurrence,
  setSelectedRecurrence,
}: RecurrenceDropdownProps) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // Helper function to get label from value
  const getLabelFromValue = (value: RecurrenceType) => {
    return recurrenceOptions.find(opt => opt.value === value)?.label || "Select Recurrence";
  };

  // Update menu position when button position changes or dropdown opens
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX - 80,
      });
    }
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-between w-full px-2 py-1.5 text-slate-100 hover:text-cyan-400 border-r border-slate-700 bg-slate-800 hover:bg-slate-700 transition-colors"
      >
        <span className="font-medium text-sm">
          {getLabelFromValue(selectedRecurrence)}
        </span>
        <motion.span variants={iconVariants} animate={open ? "open" : "closed"} className="text-cyan-400">
          <FiChevronDown />
        </motion.span>
      </button>

      {open &&
        createPortal(
          <motion.ul
            initial="closed"
            animate="open"
            variants={wrapperVariants}
            className="fixed w-48 bg-slate-900 shadow-2xl rounded-lg p-2 overflow-hidden border border-cyan-500/30 z-50"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
          >
            {recurrenceOptions.map((option) => (
              <Option
                key={option.value}
                text={option.label}
                onClick={() => {
                  setSelectedRecurrence(option.value);
                  setOpen(false);
                }}
              />
            ))}
          </motion.ul>,
          document.body
        )}
    </div>
  );
};

const Option = ({ text, onClick }: { text: string; onClick: () => void }) => (
  <motion.li
    variants={itemVariants}
    onClick={onClick}
    className="flex items-center gap-2 w-full p-2 text-xs font-medium whitespace-nowrap rounded-md bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-cyan-400 transition-colors cursor-pointer"
  >
    {text}
  </motion.li>
);

// Rest of the code remains the same

export default RecurrenceDropdown;

const wrapperVariants = {
    open: {
      scaleY: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
    closed: {
      scaleY: 0,
      transition: {
        when: "afterChildren",
        staggerChildren: 0.1,
      },
    },
  };
  

const iconVariants = {
  open: { rotate: 180 },
  closed: { rotate: 0 },
};

const itemVariants = {
  open: { opacity: 1, y: 0 },
  closed: { opacity: 0, y: -15 },
};
