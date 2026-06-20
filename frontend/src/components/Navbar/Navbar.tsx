import React, { useEffect, useRef, useState } from 'react'
import Cursor from './Cursor'
import Tab from './Tab'
import { FaUserPlus, FaUsers } from 'react-icons/fa'
import {  MdGroupAdd } from 'react-icons/md'
import { HiOutlineLogout } from 'react-icons/hi'
import { Position } from '../types/types'
import JoinGroupModal from '../JoinGroup/JoinGroupModal'
import { useAuth } from '../../context/AuthContext'
import CreateGroupModalTemp from '../CreateGroup/CreateGroupModalTemp'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Logo from '../Logo/Logo'
import NotificationBell from '../Notifications/NotificationBell'
//import axios from 'axios'
//import { useAuth } from '../components/Authentication/AuthContext' // Add this import

type PositionWithoutHeightAndTop = Omit<Position, "height" | "top">;



const Navbar: React.FC = () => {
  const { user, logout } = useAuth(); // Get user and logout from auth context
  const [position, setPosition] = React.useState<PositionWithoutHeightAndTop>({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = React.useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isMounted = useRef(true);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate("/profile");
    setIsProfileMenuOpen(false);
  };

  const handleLogoutClick = async () => {
    try {
      setIsLoggingOut(true);
      console.log('[Navbar] Logout initiated');
      await logout();
      console.log('[Navbar] Logout completed, clearing UI state');
      setIsProfileMenuOpen(false);
      // Use replace to prevent back button issues
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      // Still navigate to login even if logout fails
      setIsProfileMenuOpen(false);
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isProfileMenuOpen]);
  const fetchProfilePicture = async () => {
    try {
      const response = await axios.get("http://localhost:5178/api/aws/profile-picture", {
        withCredentials: true,
      });

      if (isMounted.current) {
        const url = response.data.url;
        const isDefault = response.data.isDefault || false;

        // Only cache non-default images
        if (!isDefault && url.includes('Expires=')) {
          const expiresMatch = url.match(/Expires=(\d+)/);
          const expiresAt = expiresMatch ? parseInt(expiresMatch[1], 10) * 1000 : Date.now() + 3600000;

          sessionStorage.setItem("profilePicture", url);
          sessionStorage.setItem("profilePictureExpiry", expiresAt.toString());
        }

        setProfilePicture(url);
      }
    } catch (error) {
      console.error("Failed to fetch profile picture:", error);
      if (isMounted.current) {
        setProfilePicture("/default-avatar.jpeg");
      }
      sessionStorage.removeItem("profilePicture");
      sessionStorage.removeItem("profilePictureExpiry");
    }
  };

  useEffect(() => {
    isMounted.current = true;
    
    // Check sessionStorage first
    const storedUrl = sessionStorage.getItem("profilePicture");
    const storedExpiry = sessionStorage.getItem("profilePictureExpiry");
    const now = Date.now();

    if (storedUrl && storedExpiry) {
      if (now < parseInt(storedExpiry, 10)) {
        // Use cached URL if not expired
        setProfilePicture(storedUrl);
        return;
      }
    }

    // Fetch new if expired or no cache
    if (user) {
      console.log("running here");
      fetchProfilePicture();
    }

    return () => {
      isMounted.current = false;
    };
  }, [user]);

  const handleImageError = () => {
    // Use default avatar on error
    setProfilePicture("/default-avatar.jpeg");
    sessionStorage.removeItem("profilePicture");
    sessionStorage.removeItem("profilePictureExpiry");
  };
  /*
  useEffect(()=>{
    if(!user) return;
    const fetchProfilePicture = async () => {
      try{
        if (user) {
          const response = await axios.get("http://localhost:5178/api/aws/profile-picture", {
            withCredentials: true,
          });
          //const url = URL.createObjectURL(response.data);
          const url = response.data.url;
          setProfilePicture(url);
        }
      } catch(error){
        console.error("Failed to get profile picture:", error);
      }
    }
    console.log("Navbar is rendering...");
    fetchProfilePicture();
  }, [user]) 
  */
  return (
    //<nav className='bg-slate-800 z-1000 top-0 py-3 flex border-none justify-between items-center sticky border-b border-slate-700'>
    <nav className="bg-slate-900/85 backdrop-blur-sm z-1000 top-0 py-3 flex justify-between items-center sticky border-b border-slate-700">
      <div className='pl-6 flex-shrink-0'>
        <Logo size={32} variant="icon" className="text-cyan-400 cursor-pointer hover:text-cyan-300 transition-colors" onClick={() => navigate('/home')} />
      </div>
      <div className='flex-1 flex justify-center'>
        <ul className='relative flex w-fit space-x-1 rounded-lg bg-slate-700/50 p-1 border border-slate-700'
        onMouseLeave={() => {
          setPosition((pv) => ({
            ...pv,
            opacity: 0,
          }));
        }}
        >
        <Tab setPosition={setPosition} to="/home">
          <div className='flex items-center space-x-2 text-white hover:text-cyan-300 transition-colors'>
            <FaUsers className="text-lg text-cyan-400" size={20} />
            <span className='font-medium'>My Groups</span>
          </div>
        </Tab>
        <Tab setPosition={setPosition}  onClick={() => setIsCreateModalOpen(true)}>
          <div className='flex items-center space-x-2 text-white hover:text-cyan-300 transition-colors'>
            <MdGroupAdd className="text-lg text-cyan-400" size={20} />
            <span className='font-medium'>Create Group</span>
          </div>
        </Tab>
        <Tab setPosition={setPosition}  onClick={() => setIsJoinModalOpen(true)}>
          <div className='flex items-center space-x-2 text-white hover:text-cyan-300 transition-colors'>
            <FaUserPlus className="text-lg text-cyan-400" size={20} />
            <span className='font-medium'>Join Group</span>
          </div>
        </Tab>
        
        <Cursor position={position} />
      </ul>

      {/* Profile Section */}
      </div>
      <div className="flex items-center pr-6 space-x-4">
        {user && (
          <>
            <NotificationBell />
            <div className='relative' ref={profileMenuRef}>
            <div
              className='flex items-center space-x-3 pl-4 border-l border-slate-600 cursor-pointer'
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            >
              <div className='hidden sm:flex flex-col items-end'>
                <p className='text-white font-medium text-sm hover:text-cyan-300 transition-colors'>{user.firstName}</p>
                <p className='text-cyan-400 text-xs font-medium'>@{user.username}</p>
              </div>
              <img
                src={profilePicture || "/default-avatar.jpeg"}
                alt="Profile"
                onError={() => setProfilePicture("/default-avatar.jpeg")}
                className="w-10 h-10 rounded-full border-2 border-cyan-400 shadow-md object-cover hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-500/30 transition-all hover:scale-110"
              />
            </div>

            {/* Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg shadow-lg z-50">
                <div className="py-2">
                  <button
                    onClick={handleProfileClick}
                    className="w-full text-left px-4 py-2 text-white hover:bg-slate-700/50 hover:text-cyan-300 transition-colors flex items-center space-x-2"
                  >
                    <span>View Profile</span>
                  </button>
                  <hr className="border-slate-700 my-1" />
                  <button
                    onClick={handleLogoutClick}
                    disabled={isLoggingOut}
                    className="w-full text-left px-4 py-2 text-red-400 hover:bg-slate-700/50 hover:text-red-300 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <HiOutlineLogout className="text-lg" />
                    <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                  </button>
                </div>
              </div>
            )}
            </div>
          </>
        )}
      </div>

      <JoinGroupModal
        isOpen={isJoinModalOpen}
        setIsOpen={setIsJoinModalOpen}
      />
      <CreateGroupModalTemp
        isOpen={isCreateModalOpen}
        setIsOpen={setIsCreateModalOpen}
      />
    </nav>
  )
};

export default Navbar;