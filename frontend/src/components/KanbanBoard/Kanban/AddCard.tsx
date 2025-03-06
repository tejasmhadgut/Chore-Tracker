import React, { FormEvent, useState } from 'react'
import {  ChoreCardType, RecurrenceType, StatusType } from '../Types/CardTypes';
import { FiPlus } from 'react-icons/fi';
import {motion} from 'framer-motion';
type AddCardProps = {
    status: StatusType;
    setCards: React.Dispatch<React.SetStateAction<ChoreCardType[]>>;
}

const AddCard = ({status,setCards}:AddCardProps) => {
    const [text,setText] = useState("");
    const [adding, setAdding] = useState(false);
    

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if(!text.trim().length) return;
        const newCard: ChoreCardType = {
            name: text.trim(),
            id: Math.random(),
            description:"",
            status: status,
            recurrence: "Daily" as RecurrenceType,
            nextOccurrence: new Date().toISOString(),
            recurrenceEndDate: null,
            //status: "todo" as StatusType,
        };
        console.log(newCard);
        setCards((pv)=>[...pv, newCard]);
        setAdding(false);
    };

  return (
    <>
        {adding ? <motion.form layout onSubmit={handleSubmit}>
            <textarea onChange={(e)=>setText(e.target.value)} autoFocus placeholder="Add new task..."
            className='w-full rounded border border-violet-400 bg-violet-400/20 p-3 text-sm text-neutral-50 placeholder-violet-300 focus:outline-0'/>
            <div className='mt-1.5 flex items-center justify-end gap-1.5'>
                <button onClick={()=> setAdding(false)} className='px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-50'>Close</button>
                <button type="submit" className='flex items-center gap-1.5 rounded bg-neutral-50 px-3 py-1.5 text-xs text-neutral-950 transition-colors hover:bg-neutral-300'>
                    <span>Add</span>
                    <FiPlus />
                </button>
            </div>
        </motion.form>: <motion.button onClick={()=>setAdding(true)} className='flex w-full items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-50'>
            <span>Add Card</span>
            <FiPlus />
        </motion.button>}
    </>
  );
}

export default AddCard