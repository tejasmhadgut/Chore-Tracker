import React, { FormEvent, useState } from 'react'
import {  ChoreCardType, RecurrenceType, StatusType } from '../Types/CardTypes';
import { Plus, X } from 'lucide-react';
import {motion} from 'framer-motion';
import RecurrenceDropdown from './RecurrenceDropdown';
import CustomDatePicker from './CustomDatePicker';
import { createChore } from '../../../services/ChoreService';
import { useParams } from 'react-router';
import { PrimaryButton, SecondaryButton } from '../../Button';

type AddCardProps = {
    status: StatusType;
    setCards: React.Dispatch<React.SetStateAction<ChoreCardType[]>>;

}

const AddCard = ({status,setCards}:AddCardProps) => {
    const [text,setText] = useState("");
    const [adding, setAdding] = useState(false);
    const [description, setDescription] = useState("");
    const [intervalDays, setIntervalDays] = useState<number | "">(1);
    const [recurrenceEndDate, setRecurrenceEndDate] = useState<string | null>(null);
    const [recurrence,setRecurrence] = useState<RecurrenceType>(RecurrenceType.Daily);
    const [difficulty, setDifficulty] = useState<number>(3); // Default to Medium (3 points)
    const {groupId} = useParams<{groupId: string}>();


    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if(!text.trim().length) {
            console.warn("Chore name is empty, ignoring submit");
            return;
        }
        try {
            if (!groupId) {
                throw new Error("Missing group ID in URL");
            }

            console.log("Creating chore with groupId:", groupId);

        const newCard: ChoreCardType = {
            name: text.trim(),
            description:description.trim(),
            status: status,
            recurrence: recurrence,
            intervalDays: recurrence === RecurrenceType.Custom ? (intervalDays ? Number(intervalDays) : null): null,
            recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate).toISOString(): null,
            difficulty: difficulty,
        } as ChoreCardType;

        console.log("Submitting chore data:", newCard);

        const createdChore = await createChore(parseInt(groupId), newCard);
        console.log("Chore created successfully:", createdChore);

        setCards((pv)=>[...pv, createdChore]);
        setAdding(false);
        setText("");
        setDescription("");
        setRecurrence(RecurrenceType.Daily);
        setIntervalDays("");
        setRecurrenceEndDate(null);
        setDifficulty(3); // Reset to Medium
    }
    catch(error){
        console.error("Failed to create chore:", error);
        if (error instanceof Error) {
            console.error("Error message:", error.message);
        }
    }
    };

  return (
    <>
        {adding ? <motion.form layout onSubmit={handleSubmit}>
            <div className='border-2 border-cyan-500/30 bg-slate-800/80 rounded-xl'>
              {/* Title Input */}
              <input
                type="text"
                value={text}
                onChange={(e)=>setText(e.target.value)}
                autoFocus
                placeholder="Task title..."
                className='w-full border-b border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all'
              />

              {/* Description Input */}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description (optional)..."
                className="w-full border-b border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all min-h-[80px] resize-none"
              />

              {/* Recurrence Options */}
              <div className="grid grid-flow-col auto-cols-[minmax(0,_1fr)] w-full border-b border-slate-700">
                <div className="w-full bg-slate-800 hover:bg-slate-700/50 transition-colors">
                  <RecurrenceDropdown
                    selectedRecurrence={recurrence}
                    setSelectedRecurrence={setRecurrence}
                  />
                </div>

                {recurrence === RecurrenceType.Custom && (
                  <div className="w-full bg-slate-800 border-l border-slate-700 hover:bg-slate-700/50 transition-colors">
                    <input
                      type="number"
                      className="w-full px-3 py-2 text-sm text-slate-100 bg-slate-800 focus:outline-none text-center"
                      value={intervalDays}
                      onChange={(e) => setIntervalDays(e.target.value ? Number(e.target.value) : "")}
                      min="1"
                    />
                  </div>
                )}

                <div className="w-full bg-slate-800 border-l border-slate-700">
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm text-slate-100 bg-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value={1}>Easy (1pt)</option>
                    <option value={3}>Medium (3pt)</option>
                    <option value={5}>Hard (5pt)</option>
                  </select>
                </div>

                <div className="w-full bg-slate-800 border-l border-slate-700 hover:bg-slate-700/50 transition-colors">
                  <CustomDatePicker
                    selectedDate={recurrenceEndDate ? new Date(recurrenceEndDate) : null}
                    setSelectedDate={(date) => setRecurrenceEndDate(date ? date.toISOString() : null)}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex items-center justify-end gap-2 p-3 bg-slate-900/50'>
                <SecondaryButton
                  type="button"
                  onClick={()=> setAdding(false)}
                  icon={<X className="w-4 h-4" />}
                  size="sm"
                >
                  Close
                </SecondaryButton>
                <PrimaryButton
                  type="submit"
                  icon={<Plus className="w-4 h-4" />}
                  size="sm"
                >
                  Add Task
                </PrimaryButton>
              </div>
            </div>
        </motion.form>: <motion.button
          onClick={()=>setAdding(true)}
          className='flex w-full items-center justify-center gap-2 px-3 py-2 text-sm text-slate-400 transition-all hover:text-cyan-400 hover:bg-slate-700/30 rounded-lg'
        >
          <Plus className="w-4 h-4" />
          <span>Add Card</span>
        </motion.button>}
    </>
  );
}

export default AddCard
