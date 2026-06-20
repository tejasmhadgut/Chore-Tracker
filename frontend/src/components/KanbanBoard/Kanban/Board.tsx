import React, { useEffect, useState } from 'react'
import BurnBarrel from './BurnBarrel';
import Column from './Column';
import { getChoresByGroup } from '../../../services/ChoreService';
import { ChoreCardType, StatusType } from '../Types/CardTypes';
import { ChoreListSkeleton } from '../../Common/Skeletons';
import { errorHandler } from '../../../services/errorHandler';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { PrimaryButton } from '../../Button';

const Board = ({groupId}: {groupId: number}) => {
    const [cards, setCards] = useState<ChoreCardType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Fetch chores from the API
        const fetchChores = async () => {
          setError(null);
          try {
            const data = await getChoresByGroup(groupId);
            setCards(data);
          } catch (err) {
            // Centralized error handling
            const message = errorHandler.handleError(err, {
              operation: 'fetching chores',
              groupId
            });
            setError(message);
          } finally {
            setLoading(false);
          }
        };

        // Initial fetch on mount
        fetchChores();

        // Set up interval to refresh chores every 30 seconds
        const intervalId = setInterval(() => {
          fetchChores();
        }, 30000);

        // Cleanup interval on unmount
        return () => clearInterval(intervalId);
    }, [groupId]);

    // Loading state with skeleton
    if (loading) {
      return (
        <div className='flex justify-center h-full w-full gap-3 overflow-scroll p-12'>
          <ChoreListSkeleton />
        </div>
      );
    }

    // Error state with user-friendly message
    if (error) {
      return (
        <div className='flex justify-center h-full w-full gap-3 overflow-scroll p-12'>
          <div className='flex flex-col items-center justify-center gap-4 w-full'>
            <AlertCircle className='w-12 h-12 text-red-400' />
            <p className='text-red-300 text-lg font-semibold'>{error}</p>
            <PrimaryButton
              onClick={() => window.location.reload()}
              icon={<RotateCcw className='w-4 h-4' />}
            >
              Try Again
            </PrimaryButton>
          </div>
        </div>
      );
    }

    // Success state with board
    return (
      <div className='flex justify-center h-full w-full gap-3 overflow-scroll p-12'>
        <Column title="TODO" status={StatusType.todo} headingColor="text-cyan-400" cards={cards} setCards={setCards} />
        <Column title="Working On It!" status={StatusType.doing} headingColor="text-cyan-400" cards={cards} setCards={setCards} />
        <Column title="Completed" status={StatusType.done} headingColor="text-cyan-400" cards={cards} setCards={setCards} />
        <BurnBarrel setCards={setCards} />
      </div>
    );
}

export default Board