import React, { Dispatch, ReactNode, SetStateAction, useRef, useState } from 'react'
import {  useLocation } from 'react-router-dom';
import { Position } from '../types/types';

type PositionWithoutHeight = Omit<Position, "height">;

type TabProps = {
    children: ReactNode;
    setPosition: Dispatch<SetStateAction<PositionWithoutHeight>>;
    to: string;
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
    className={`relative z-1 block cursor-pointer px-1 py-1 text-xs  md:px-4 md:py-4 md:text-base ${hovered? 'text-gray-300  delay-100': 'text-black'} `}
    >
        
        {isActive ? children: <a href={to} >{children}</a>}
       
    </li>
  )
}

export default Tab