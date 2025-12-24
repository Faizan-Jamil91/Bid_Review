'use client';

import React from 'react';
import MilestonesList from '../../../components/milestones/MilestonesList';

export default function MilestonesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Milestones</h1>
        <p className="mt-2 text-gray-600">Manage project milestones and track progress</p>
      </div>
      
      <MilestonesList />
    </div>
  );
}
