import React, { useState } from 'react'
import { motion } from 'framer-motion';
import {  ChoreCardType,  StatusType } from '../Types/CardTypes';
import Card from './Card';
import AddCard from './AddCard';
import { clearHighlights, getIndicators, getNearestIndicator, highlightIndicator } from './utils/dragUtils';
import DropIndicator from './DropIndicator';
import { updateChoreStatus } from '../../../services/ChoreService';
import confetti from 'canvas-confetti';

type ColumnProps = {
    title: string;
    headingColor: string;
    status: StatusType;
    cards: ChoreCardType[];
    setCards: React.Dispatch<React.SetStateAction<ChoreCardType[]>>;
}

const Column = (
    {title, headingColor, status, cards, setCards} : ColumnProps
) => {
    const [active, setActive] = useState(false);
    const filteredCards = cards.filter((c) => c.status == status);
    const handleDragStart = (e:React.DragEvent<HTMLDivElement>,card:ChoreCardType) => {
        e.dataTransfer?.setData("cardId", card.id.toString());
    };
    const handleDragOver = (e:React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        highlightIndicator(e,status);
        setActive(true);
    }
    const handleDragLeave = () => {
        setActive(false);
        clearHighlights(status);
    }
    const handleDragEnd = async (e:React.DragEvent<HTMLDivElement>) => {
        setActive(false);
        clearHighlights(status);
        const cardId = e.dataTransfer?.getData("cardId");
        const indicators = getIndicators(status);
        const {element} = getNearestIndicator(e, indicators);
        const before = element.dataset.before || "-1";
        if(before !== cardId){
            let copy = [...cards];
            let cardToTransfer = copy.find((c)=>c.id===parseInt(cardId));
            if(!cardToTransfer) return;
            cardToTransfer = {...cardToTransfer, status};
            try{
                console.log("cardToTransfer.id = "+cardToTransfer.id);
                console.log("statusMap[status] = "+status);
                await updateChoreStatus(cardToTransfer.id, status);
                copy = copy.filter((c)=> c.id !== parseInt(cardId));
                const moveToBack = before === "-1";
                if(moveToBack) {
                    copy.push(cardToTransfer);
                }else{
                    const insertAtIndex = copy.findIndex((el)=>el.id === parseInt(before));
                    if(insertAtIndex===undefined) return;
                    copy.splice(insertAtIndex, 0, cardToTransfer);

                }
                setCards(copy);

                // Trigger confetti celebration when chore is marked as done
                if(status === StatusType.done) {
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#06b6d4', '#0891b2', '#0e7490']
                    });
                }
            } catch(error){
                console.error("Failed to update card status", error);
            }
   
        }
    }

  return (
    <div className='w-56 shrink-0'>
        <div className='mb-3 flex items-center justify-around px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 border-t-2 border-t-cyan-500'>
            <h3 className={`font-bold ${headingColor}`}>{title}</h3>
            <span className='rounded-full text-sm text-cyan-300 bg-cyan-600/20 px-2.5 py-0.5 font-semibold'>{filteredCards.length}</span>
        </div>
        <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDragEnd}
        animate={{
          backgroundColor: active ? "rgba(34, 211, 238, 0.1)" : "rgba(0, 0, 0, 0)",
          borderColor: active ? "rgba(34, 211, 238, 0.7)" : "transparent",
        }}
        transition={{ duration: 0.2 }}
        className={`h-full w-full rounded-lg ${active ? "border-2 shadow-lg shadow-cyan-500/10" : "border border-transparent"}`}
        style={{minHeight: filteredCards.length > 0 ? "auto":"200px"}}>
        {filteredCards.map((c)=> {

            return <Card key={c.id} {...c} handleDragStart={handleDragStart}/>
        })}
        <DropIndicator beforeId="-1" status={status} />
        <AddCard status={status} setCards={setCards} />
        </motion.div>
        </div>
  )
}

export default Column

