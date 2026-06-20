import React, { Dispatch, ReactNode, SetStateAction, useRef, useState } from 'react'
import {  useLocation, Link } from 'react-router-dom';
import { Position } from '../types/types';

type PositionWithoutHeightAndTop = Omit<Position, "height" | "top">;


type TabProps = {
    children: ReactNode;
    setPosition: Dispatch<SetStateAction<PositionWithoutHeightAndTop>>;
    to?: string;
    onClick?: () => void;
}

const Tab: React.FC<TabProps> = ({ children, setPosition, to, onClick }) => {
    const ref = useRef<HTMLLIElement | null>(null);
    const location = useLocation();
    const isActive = location.pathname == to;
    const [hovered, setHovered] = useState(false);
  return (
    <li ref={ref} onMouseEnter={()=> {
        if(!ref.current) return;
        const {width} = ref.current.getBoundingClientRect();
        setPosition({left: ref.current.offsetLeft, width, opacity: 1});
        setHovered(true);
        }}
        onClick={onClick}
        onMouseLeave={()=> setHovered(false)}
    className="relative z-1 block cursor-pointer px-3 py-1.5 rounded-md transition-colors text-sm"
    >
        
        {isActive ? children: <Link to={to || "#"} >{children}</Link>}
       
    </li>
  )
}

export default Tab