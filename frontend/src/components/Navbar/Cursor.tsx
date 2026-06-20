import React from 'react'
import { motion } from 'framer-motion'
import { Position } from '../types/types'

type PositionWithoutHeightAndTop = Omit<Position, "height" | "top">;

const Cursor = ({position}: {position: PositionWithoutHeightAndTop }) => {
  return (
    <motion.li animate={{...position}} className='absolute z-0 h-8 rounded-md bg-slate-600 opacity-100 transition-all top-1' />
  )
}

export default Cursor