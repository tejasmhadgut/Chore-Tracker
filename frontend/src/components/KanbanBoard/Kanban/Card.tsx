import React from 'react'
import { motion } from "framer-motion";
import { ChoreCardType } from '../Types/CardTypes';
import DropIndicator from './DropIndicator';

type CardProps = ChoreCardType & {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    handleDragStart: Function;
}

const Card = ({name, id, status, handleDragStart}: CardProps) => {
  return (
    <>
    <DropIndicator beforeId={id.toString()} status={status} />
        <motion.div layout layoutId={id.toString()} draggable="true" onDragStart={(e)=> handleDragStart(e, {name, id, status})} className='cursor-grab rounded border border-neutral-700 bg-neutral-800 p-3 active:cursor-grabbing'>
            <p className='text-sm text-neutral-100 '>{name}</p>
        </motion.div>

    </>
  )
}

export default Card