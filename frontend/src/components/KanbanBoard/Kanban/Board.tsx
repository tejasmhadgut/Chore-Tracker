import React, { useEffect, useState } from 'react'

import BurnBarrel from './BurnBarrel';
import Column from './Column';
import { getChoresByGroup } from '../../../services/ChoreService';
import { ChoreCardType } from '../Types/CardTypes';



const Board = ({groupId}: {groupId: number}) => {
    const [cards, setCards] = useState<ChoreCardType[]>([]);
    useEffect(() => {
        // Fetch chores from the API
        const fetchChores = async () => {
          try {
            const data = await getChoresByGroup(groupId);
            setCards(data);  // Set the fetched chores to state
          } catch (error) {
            console.error("Error fetching chores: ", error);
          }
        };
    
        fetchChores();
      }, [groupId]); 
  return (
    <div className='flex h-full w-full gap-3 overflow-scroll p-12'>
        <Column title="TODO" status="todo" headingColor="text-yellow-500" cards={cards} setCards={setCards} />
        <Column title="Working On It!" status="doing" headingColor="text-blue-500" cards={cards} setCards={setCards} />
        <Column title="Completed" status="done" headingColor="text-emerald-500" cards={cards} setCards={setCards} />
        <BurnBarrel setCards={setCards} />
    </div>
  )
}

export default Board