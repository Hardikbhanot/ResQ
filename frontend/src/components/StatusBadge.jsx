import React from 'react';

const StatusBadge = ({ status }) => {
    let color = '#94a3b8'; // Default grey
    let text = status;

    switch (status) {
        case 'OPEN':
        case 'New':
            color = '#F97316'; // Orange
            text = 'New';
            break;
        case 'IN_PROGRESS':
        case 'In Progress':
        case 'Transporting':
            color = '#EAB308'; // Yellow
            text = 'In Progress';
            break;
        case 'RESOLVED':
        case 'Resolved':
            color = '#22C55E'; // Green
            text = 'Resolved';
            break;
        case 'PENDING_REVIEW':
        case 'Searching':
            color = '#F97316';
            text = 'Searching';
            break;
        default:
            break;
    }

    return (
        <span style={{ color: color, fontSize: '0.75rem', fontWeight: '600' }}>
            Status: <span style={{ color: color }}>{text}</span>
        </span>
    );
};

export default StatusBadge;
