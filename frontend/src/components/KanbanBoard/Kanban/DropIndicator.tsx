import React from 'react'
import { StatusType } from '../Types/CardTypes';

type DropIndicatorProps = {
    beforeId: string | null;
    status: StatusType
}

const DropIndicator = ({beforeId,status}: DropIndicatorProps) => {
  return (
    <div data-before={beforeId || "-1"} data-column={status} className='my-0.5 h-0.5 w-full bg-violet-400 opacity-0' />
  )
}

export default DropIndicator