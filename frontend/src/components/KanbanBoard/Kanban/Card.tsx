import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChoreCardType, RecurrenceType } from "../Types/CardTypes";
import DropIndicator from "./DropIndicator";

// Helper function with numeric checks
const getRecurrenceLabel = (recurrence: RecurrenceType): string => {
  switch (recurrence) {
    case RecurrenceType.Daily:
      return "Daily";
    case RecurrenceType.Weekly:
      return "Weekly";
    case RecurrenceType.Monthly:
      return "Monthly";
    case RecurrenceType.Custom:
      return "Custom";
    case RecurrenceType.None:
      return "None";
    default:
      return "Unknown";
  }
};
const getRecurrenceColor = (recurrence: RecurrenceType): string => {
    switch (recurrence) {
      case RecurrenceType.Daily:
        return "bg-cyan-600/30 text-cyan-300 border border-cyan-500/30";
      case RecurrenceType.Weekly:
        return "bg-cyan-600/20 text-cyan-300 border border-cyan-500/30";
      case RecurrenceType.Monthly:
        return "bg-cyan-600/25 text-cyan-300 border border-cyan-500/30";
      case RecurrenceType.Custom:
        return "bg-cyan-600/35 text-cyan-300 border border-cyan-500/30";
      case RecurrenceType.None:
        return "bg-slate-600/40 text-slate-200 border border-slate-500/30";
      default:
        return "bg-slate-600/40 text-slate-200 border border-slate-500/30";
    }
  };

const getDifficultyBadge = (difficulty?: number): { label: string; color: string } => {
  switch (difficulty) {
    case 1:
      return { label: "Easy (1pt)", color: "bg-green-600/30 text-green-300 border border-green-500/30" };
    case 5:
      return { label: "Hard (5pt)", color: "bg-red-600/30 text-red-300 border border-red-500/30" };
    default:
      return { label: "Medium (3pt)", color: "bg-yellow-600/30 text-yellow-300 border border-yellow-500/30" };
  }
};




type CardProps = ChoreCardType & {
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, card: ChoreCardType) => void;
};

const Card = ({ name, id, status, recurrence, description, intervalDays, recurrenceEndDate, difficulty, handleDragStart }: CardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const expandTimeout = useRef<number | null>(null);
    const collapseTimeout = useRef<number | null>(null);

    const handleMouseEnter = () => {
      if (collapseTimeout.current) {
        window.clearTimeout(collapseTimeout.current);
      }
      expandTimeout.current = window.setTimeout(() => setIsExpanded(true), 100);
    };

    const handleMouseLeave = () => {
      if (expandTimeout.current) {
        window.clearTimeout(expandTimeout.current);
      }
      collapseTimeout.current = window.setTimeout(() => setIsExpanded(false), 200);
    };

    // Cleanup timeouts on component unmount to prevent memory leaks
    useEffect(() => {
      return () => {
        if (expandTimeout.current) {
          window.clearTimeout(expandTimeout.current);
        }
        if (collapseTimeout.current) {
          window.clearTimeout(collapseTimeout.current);
        }
      };
    }, []);
  
    return (
      <>
        <DropIndicator beforeId={id.toString()} status={status} />
        <motion.div
          layout
          layoutId={id.toString()}
          draggable="true"
          onDragStart={(e) => {
            setIsDragging(true);
            if ("dataTransfer" in e) {
              handleDragStart(e as unknown as React.DragEvent<HTMLDivElement>, {
                name,
                id,
                status,
                recurrence: Number(recurrence),
                description,
                intervalDays,
                recurrenceEndDate,
                difficulty
              });
            }
          }}
          onDragEnd={() => setIsDragging(false)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          animate={{
            opacity: isDragging ? 0.5 : 1,
            scale: isDragging ? 0.95 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.2
          }}
          className="cursor-grab rounded border-2 border-cyan-500/50 bg-slate-700/60 p-3 active:cursor-grabbing relative hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20 transition-all my-1"
        >
    <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text font-semibold text-white hover:text-cyan-300 transition-colors">{name}</h1>
            <div className={`text-xs px-2 py-2 rounded-full font-medium  transition-all hover:bg-opacity-90 ${getRecurrenceColor(Number(recurrence))}`}>
                {getRecurrenceLabel(Number(recurrence))}
                {Number(recurrence) === RecurrenceType.Custom && intervalDays && (
                ` (Every ${intervalDays} days)`
                )}
            </div>
            <div className={`text-xs px-2 py-2 rounded-full font-medium transition-all hover:bg-opacity-90 ${getDifficultyBadge(difficulty).color}`}>
                {getDifficultyBadge(difficulty).label}
            </div>
        </div>

    </div>
  
          <motion.div
            initial={false}
            animate={{ 
              opacity: isExpanded ? 1 : 0,
              height: isExpanded ? "auto" : 0 
            }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2">
              <div>
                <p className="font-normal text-sm text-gray-200">{description || "No description"}</p>
              </div>

              {recurrenceEndDate && (
                <div>
                  <p className="text-xs text-gray-400">End Date:</p>
                  <p className="text-sm text-cyan-300">
                    {new Date(recurrenceEndDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </>
    );
  };
  
  export default Card;