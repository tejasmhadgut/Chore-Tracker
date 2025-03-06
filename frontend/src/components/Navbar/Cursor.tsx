import React from 'react'
import { motion } from 'framer-motion'
import { Position } from '../types/types'

type PositionWithoutHeight = Omit<Position, "height">;

const Cursor = ({position}: {position: PositionWithoutHeight }) => {
  return (
    <motion.li animate={{...position}} className='absolute z-0 h-15 rounded-3xl bg-gradient-to-r  from-[#3253b4] to-[#0a3281] md:h-15 opacity-65' />
  )
}

export default Cursor