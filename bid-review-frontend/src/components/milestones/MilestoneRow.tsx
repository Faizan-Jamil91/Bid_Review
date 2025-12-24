import React, { memo } from 'react';
import { getMilestoneStatusBadge, getMilestoneStatusIcon } from '../../services/milestoneService';

interface MilestoneRowProps {
  milestone: any;
  onEdit?: (milestone: any) => void;
  onDelete?: (milestone: any) => void;
  formatDate: (dateString: string) => string;
}

const MilestoneRow: React.FC<MilestoneRowProps> = ({ 
  milestone, 
  onEdit, 
  onDelete, 
  formatDate 
}) => {
  const isOverdue = () => {
    if (!milestone.due_date) return false;
    const dueDate = new Date(milestone.due_date);
    const now = new Date();
    return dueDate < now && milestone.status !== 'completed' && milestone.status !== 'cancelled';
  };

  const getProgressPercentage = () => {
    if (milestone.status === 'completed') return 100;
    if (milestone.status === 'in_progress') return 50;
    if (milestone.status === 'delayed') return 25;
    return 0;
  };

  const getProgressBarColor = () => {
    if (milestone.status === 'completed') return 'bg-green-500';
    if (milestone.status === 'delayed' || isOverdue()) return 'bg-red-500';
    if (milestone.status === 'in_progress') return 'bg-blue-500';
    return 'bg-gray-300';
  };

  return (
    <tr className={`border-t hover:bg-gray-50 ${isOverdue() ? 'bg-red-50' : ''}`}>
      <td className="py-3 px-4">
        <div className="flex items-center">
          <i className={`${getMilestoneStatusIcon(milestone.status)} mr-2 text-sm ${
            milestone.status === 'in_progress' ? 'text-blue-600' :
            milestone.status === 'completed' ? 'text-green-600' :
            milestone.status === 'delayed' ? 'text-red-600' :
            milestone.status === 'cancelled' ? 'text-gray-600' :
            'text-yellow-600'
          }`}></i>
          <div>
            <div className="font-medium text-gray-900">{milestone.name}</div>
            {milestone.description && (
              <div className="text-sm text-gray-500 mt-1">{milestone.description}</div>
            )}
          </div>
        </div>
      </td>
      
      <td className="py-3 px-4">
        <div>
          <div className="text-sm font-medium text-gray-900">{milestone.bid_code}</div>
          <div className="text-sm text-gray-500">{milestone.bid_title}</div>
        </div>
      </td>

      <td className="py-3 px-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMilestoneStatusBadge(milestone.status)}`}>
          {milestone.status.replace('_', ' ').toUpperCase()}
        </span>
        {isOverdue() && (
          <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded">
            Overdue
          </span>
        )}
      </td>

      <td className="py-3 px-4">
        <div className="flex items-center">
          {milestone.assigned_to_detail ? (
            <>
              <div className="text-sm text-gray-900">
                {milestone.assigned_to_detail.first_name} {milestone.assigned_to_detail.last_name}
              </div>
              <div className="text-xs text-gray-500">
                {milestone.assigned_to_detail.email}
              </div>
            </>
          ) : (
            <span className="text-gray-500 text-sm">Unassigned</span>
          )}
        </div>
      </td>

      <td className="py-3 px-4">
        <div className="space-y-2">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          
          {/* Due Date */}
          <div className="text-sm text-gray-900">
            <i className="far fa-calendar-alt mr-1"></i>
            {formatDate(milestone.due_date)}
          </div>
          
          {/* Completed Date */}
          {milestone.completed_date && (
            <div className="text-sm text-green-600">
              <i className="far fa-check-circle mr-1"></i>
              Completed: {formatDate(milestone.completed_date)}
            </div>
          )}
          
          {/* Overdue Warning */}
          {isOverdue() && (
            <div className="text-sm text-red-600 font-medium">
              <i className="fas fa-exclamation-triangle mr-1"></i>
              Overdue by {Math.ceil((new Date().getTime() - new Date(milestone.due_date).getTime()) / (1000 * 60 * 60 * 24))} days
            </div>
          )}
        </div>
      </td>

      <td className="py-3 px-4 text-center">
        <button
          onClick={() => onEdit?.(milestone)}
          className="text-blue-600 hover:text-blue-800 mr-3"
          title="Edit milestone"
        >
          <i className="fas fa-edit"></i>
        </button>
        <button
          onClick={() => onDelete?.(milestone)}
          className="text-red-600 hover:text-red-800"
          title="Delete milestone"
        >
          <i className="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  );
};

MilestoneRow.displayName = 'MilestoneRow';

export default MilestoneRow;
