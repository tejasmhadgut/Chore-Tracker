import React, { useState } from 'react'
import { FaFire } from 'react-icons/fa';
import { FiTrash } from 'react-icons/fi';
import { ChoreCardType } from '../Types/CardTypes';
import { deleteChore } from '../../../services/ChoreService';


const BurnBarrel = ({setCards}: {setCards: React.Dispatch<React.SetStateAction<ChoreCardType[]>>}) => {
    const [active, setActive] = useState(false);
    
    const handleDragOver = (e:React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setActive(true);
    }
    const handleDragLeave = () => {
        setActive(false);
    }
    const handleDragEnd = async (e: React.DragEvent<HTMLDivElement>) => {
        const cardId = e.dataTransfer?.getData("cardId");
        
        if (!cardId) return;

        try {
            // Delete from backend
            await deleteChore(parseInt(cardId));
            
            // Update frontend state
            setCards((pv) => pv.filter((c) => c.id !== parseInt(cardId)));
            
        } catch (error) {
            console.error("Failed to delete chore:", error);
            // Optionally show error to user
        } finally {
            setActive(false);
        }
    }
  return (
    <div
        onDrop={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`mt-10 grid h-56 w-56 shrink-0 place-content-center rounded-xl border-2 text-3xl
            ${
                active
                ? "border-red-500 bg-red-500/15 text-red-400 font-bold border-4 shadow-lg shadow-red-500/30"
                : "border-slate-600 bg-slate-800/50 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-all"
            }
            transition-colors duration-200`}
    >
        {active ? (
            <FaFire className="animate-bounce fill-current" />
        ) : (
            <FiTrash className="fill-current" />
        )}
    </div>
)
}

export default BurnBarrel


