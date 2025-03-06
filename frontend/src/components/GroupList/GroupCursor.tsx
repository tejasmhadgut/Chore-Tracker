import React from "react";
import { Position } from "../types/types";
import { motion } from "framer-motion";

const GroupCursor = ({ position }: { position: Position }) => {
  return (
    <motion.div
      animate={{
        left: position.left,
        width: position.width,
        height: position.height,
        opacity: position.opacity,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
      className="absolute bg-gray-300 rounded-lg shadow-lg -z-1"
    />
  );
};

export default GroupCursor;
