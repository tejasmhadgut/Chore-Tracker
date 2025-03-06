import React, { useState } from 'react'
import Cursor from './Cursor'
import Tab from './Tab'
import { FaUserPlus, FaUsers } from 'react-icons/fa'
import { MdAccountCircle, MdGroupAdd } from 'react-icons/md'
import { Position } from '../types/types'
import JoinGroupModal from '../JoinGroup/JoinGroupModal'

type PositionWithoutHeight = Omit<Position, "height">;

type NavbarProps = {
  refreshGroups: () => void; // Pass refreshGroups prop to the Navbar component
};

const Navbar: React.FC<NavbarProps> = ({ refreshGroups }) => {
  const [position, setPosition] = useState<PositionWithoutHeight>({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <nav className='bg-[#e8edf2] z-20 py-1 mr-auto flex border-[1px] justify-center sticky shadow-gray-500 shadow-xs'>
      <ul
        onMouseLeave={() => setPosition((prev) => ({ ...prev, opacity: 0 }))}
        className='relative mx-auto flex w-fit space-x-2 rounded-4xl border-black bg-neautral-100 p-1'
      >
        <Tab setPosition={setPosition} to="/home">
          <div className='flex items-center space-x-2'><FaUsers className="text-xl" size={22} /> <span>My Groups</span></div>
        </Tab>
        <Tab setPosition={setPosition} to="/create-group">
          <div className='flex items-center space-x-2'><FaUserPlus className="text-xl" size={22}  /><span>Create Group</span></div>
        </Tab>
        <Tab setPosition={setPosition} to="#" onClick={() => setIsModalOpen(true)}>
          <div className='flex items-center space-x-2'><MdGroupAdd className="text-xl" size={22} /><span>Join Group</span></div>
        </Tab>
        <Tab setPosition={setPosition} to="/profile">
          <div className='flex items-center space-x-2'><MdAccountCircle className="text-xl" size={22} /><span>Profile</span></div>
        </Tab>
        <Cursor position={position} />
      </ul>
      <JoinGroupModal 
        isOpen={isModalOpen} 
        setIsOpen={setIsModalOpen} 
        refreshGroups={refreshGroups}  // Pass the refreshGroups function to the modal
      />
    </nav>
  )
}

export default Navbar;
