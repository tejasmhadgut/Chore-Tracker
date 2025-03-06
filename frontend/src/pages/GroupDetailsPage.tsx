import React from 'react'
import { useParams } from 'react-router'
import Board from '../components/KanbanBoard/Kanban/Board';


const GroupDetailsPage = () => {
    const {groupId} = useParams<{groupId?: string}>();
  return (
    <div>
        {groupId ? <Board groupId={parseInt(groupId, 10)} /> : <p>Invalid group ID</p>}
    </div>
  )
}

export default GroupDetailsPage