import React, { useState } from 'react'
import {  ChoreCardType,  StatusType } from '../Types/CardTypes';
import Card from './Card';
import AddCard from './AddCard';
import { clearHighlights, getIndicators, getNearestIndicator, highlightIndicator } from './utils/dragUtils';
import DropIndicator from './DropIndicator';

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
    const handleDragEnd = (e:React.DragEvent<HTMLDivElement>) => {
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
        }
    }
    
    
    

    

  return (
    <div className='w-56 shrink-0'>
        <div className='mb-3 flex items-center justify-between'>
            <h3 className={`font medium ${headingColor}`}>{title}</h3>
            <span className='rounded text-sm text-neutral-400'>{filteredCards.length}</span>
        </div>
        <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDragEnd} className={`h-full w-full transition-colors ${active ? "bg-neutral-800/50" : "bg-neutral-800/0"}`}>
        {filteredCards.map((c)=> {
            return <Card key={c.id} {...c} handleDragStart={handleDragStart}/>
        })}
        <DropIndicator beforeId="-1" status={status} />
        <AddCard status={status} setCards={setCards} />
        </div>
        </div>
  )
}

export default Column

