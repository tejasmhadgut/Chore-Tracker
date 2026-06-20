import { StatusType } from '../Types/CardTypes';
import { motion } from 'framer-motion';

type DropIndicatorProps = {
    beforeId: string | null;
    status: StatusType
}

const DropIndicator = ({beforeId,status}: DropIndicatorProps) => {
  return (
    <motion.div
      data-before={beforeId || "-1"}
      data-column={status}
      className='my-2 h-0.5 w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 rounded-full'
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 'var(--drop-opacity, 0)', scaleX: 1 }}
      transition={{ duration: 0.2 }}
      style={{
        boxShadow: '0 0 8px rgba(34, 211, 238, 0.4)',
      }}
    />
  )
}

export default DropIndicator