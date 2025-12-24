import React, { useState, useEffect } from 'react';
import { getMilestones, deleteMilestone, calculateMilestoneProgress, getOverdueMilestones, getUpcomingMilestones } from '../../services/milestoneService';
import MilestoneRow from './MilestoneRow';
import MilestoneForm from './MilestoneForm';

interface MilestonesListProps {
  bidId?: string;
  showStats?: boolean;
  showFilters?: boolean;
}

const MilestonesList: React.FC<MilestonesListProps> = ({ 
  bidId, 
  showStats = true,
  showFilters = true 
}) => {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        setLoading(true);
        const params = bidId ? { bid: bidId } : {};
        const response = await getMilestones(params);
        setMilestones(response.results || response);
        setError('');
      } catch (err: any) {
        console.error('Error fetching milestones:', err);
        setError('Failed to load milestones');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMilestones();
  }, [bidId]);

  const handleCreateSuccess = (newMilestone: any) => {
    setMilestones(prev => [...prev, newMilestone]);
    setShowForm(false);
  };

  const handleEditSuccess = (updatedMilestone: any) => {
    setMilestones(prev => 
      prev.map(m => m.id === updatedMilestone.id ? updatedMilestone : m)
    );
    setEditingMilestone(null);
  };

  const handleDelete = async (milestone: any) => {
    if (window.confirm(`Are you sure you want to delete "${milestone.name}"?`)) {
      try {
        await deleteMilestone(milestone.id);
        setMilestones(prev => prev.filter(m => m.id !== milestone.id));
      } catch (err: any) {
        console.error('Error deleting milestone:', err);
        setError('Failed to delete milestone');
      }
    }
  };

  const handleEdit = (milestone: any) => {
    setEditingMilestone(milestone);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredMilestones = milestones.filter((milestone: any) => {
    const matchesStatus = filterStatus === 'all' || milestone.status === filterStatus;
    const matchesSearch = !searchTerm || 
      milestone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      milestone.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      milestone.bid_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const progress = calculateMilestoneProgress(filteredMilestones);
  const overdueCount = getOverdueMilestones(filteredMilestones).length;
  const upcomingCount = getUpcomingMilestones(filteredMilestones, 7).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <i className="fas fa-spinner fa-spin text-blue-600 text-2xl"></i>
        <span className="ml-3 text-gray-600">Loading milestones...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <i className="fas fa-exclamation-triangle text-red-600 text-2xl mb-2"></i>
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {bidId ? 'Bid Milestones' : 'All Milestones'}
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          Create Milestone
        </button>
      </div>

      {/* Statistics */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Progress</p>
                <p className="text-2xl font-bold text-gray-900">{progress}%</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <i className="fas fa-chart-line text-blue-600"></i>
              </div>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Milestones</p>
                <p className="text-2xl font-bold text-gray-900">{filteredMilestones.length}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <i className="fas fa-flag text-gray-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-red-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming (7 days)</p>
                <p className="text-2xl font-bold text-yellow-600">{upcomingCount}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <i className="fas fa-clock text-yellow-600"></i>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search milestones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="delayed">Delayed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Milestones Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Milestone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bid
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress & Dates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredMilestones.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  <div className="mb-4">
                    <i className="fas fa-flag text-gray-400 text-4xl"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm || filterStatus !== 'all' ? 'No milestones found' : 'No milestones yet'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'Try adjusting your search or filters.' 
                      : 'Get started by creating your first milestone.'
                    }
                  </p>
                  {!searchTerm && filterStatus === 'all' && (
                    <button
                      onClick={() => setShowForm(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Create First Milestone
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredMilestones.map((milestone: any) => (
                <MilestoneRow
                  key={milestone.id}
                  milestone={milestone}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  formatDate={formatDate}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Milestone Form Modal */}
      {(showForm || editingMilestone) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingMilestone ? 'Edit Milestone' : 'Create New Milestone'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingMilestone(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              <MilestoneForm
                onSuccess={editingMilestone ? handleEditSuccess : handleCreateSuccess}
                onCancel={() => {
                  setShowForm(false);
                  setEditingMilestone(null);
                }}
                initialData={editingMilestone || {}}
                bidId={bidId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestonesList;
