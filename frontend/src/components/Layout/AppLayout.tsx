import React from 'react'
import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';



const AppLayout = () => {
    // Handle group joining


    // Only pass necessary props
    /*
    const navbarProps =  useMemo(() => {
        const props: Record<string, unknown> = {};
        if (location.pathname === "/home" || location.pathname.startsWith("/group-details")) {
            props.refreshGroups = fetchGroups;
        }
        if (location.pathname.startsWith("/group-details")) {
            props.onGroupJoined = handleGroupJoined;
        }
        return props;
    }, [location.pathname, fetchGroups, handleGroupJoined]);
    */
    

    return (
        <>
            <Navbar  />
            <Outlet /> 
        </>
    );
}

export default AppLayout