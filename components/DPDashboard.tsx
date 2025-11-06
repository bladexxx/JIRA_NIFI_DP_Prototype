import React from 'react';
import { DeploymentPlan } from '../types';
import { StatusBadge } from './StatusBadge';
import { ChevronRightIcon } from './icons';

interface DPDashboardProps {
  dps: DeploymentPlan[];
  onSelectDp: (id: string) => void;
}

const DPDashboard: React.FC<DPDashboardProps> = ({ dps, onSelectDp }) => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-text-main mb-6">NIFI Deployment Plans</h1>
      <div className="space-y-4">
        {dps.map(dp => (
          <div
            key={dp.id}
            onClick={() => onSelectDp(dp.id)}
            className="bg-panel p-5 rounded-lg border border-panel-border shadow-sm hover:shadow-md hover:border-primary cursor-pointer transition-all duration-200"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg font-semibold text-text-main">{dp.id}: {dp.summary}</p>
                <p className="text-sm text-text-secondary">Project: {dp.description.projectName} | Owner: {dp.description.owner}</p>
              </div>
              <div className="flex items-center space-x-4">
                <StatusBadge status={dp.status} />
                <ChevronRightIcon />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DPDashboard;