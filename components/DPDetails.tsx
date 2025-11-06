import React from 'react';
import { DeploymentPlan, DeploymentObject, Status } from '../types';
import { StatusBadge } from './StatusBadge';
import { CheckCircleIcon, XCircleIcon, PlayIcon, DotsCircleHorizontalIcon, ClockIcon } from './icons';

interface DPDetailsProps {
  dp: DeploymentPlan;
  dos: DeploymentObject[];
  onBack: () => void;
  onApprove: (dpId: string) => void;
  onSelectDo: (doId: string) => void;
}

const DetailItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-sm text-text-secondary">{label}</p>
    <p className="text-base text-text-main">{value}</p>
  </div>
);

const DOStatusIcon: React.FC<{status: Status}> = ({status}) => {
    switch (status) {
        case Status.Completed: return <CheckCircleIcon />;
        case Status.Failed: return <XCircleIcon />;
        case Status.InProgress: return <DotsCircleHorizontalIcon />;
        case Status.Open: return <PlayIcon />;
        default: return <ClockIcon/>;
    }
};

const DPDetails: React.FC<DPDetailsProps> = ({ dp, dos, onBack, onApprove, onSelectDo }) => {
  const isApprovable = dp.status === Status.PendingApproval;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-text-link hover:underline">
          &larr; Back to Dashboard
        </button>
        {isApprovable && (
          <button
            onClick={() => onApprove(dp.id)}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            Approve DP
          </button>
        )}
      </div>

      <div className="bg-panel p-6 rounded-lg border border-panel-border shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-text-main">{dp.id}: {dp.summary}</h1>
            <p className="text-text-secondary">Project: {dp.description.projectName}</p>
          </div>
          <StatusBadge status={dp.status} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <DetailItem label="Owner" value={dp.description.owner} />
          <DetailItem label="Admin" value={dp.description.admin} />
          <DetailItem label="ENT Developer" value={dp.description.entDeveloper} />
          <DetailItem label="User" value={dp.description.user} />
          <DetailItem label="Target Cluster" value={dp.description.targetCluster} />
        </div>
        <div className="mt-6 pt-4 border-t border-panel-border">
          <h3 className="text-lg font-semibold text-text-main mb-2">Notes</h3>
          <div className="text-sm space-y-2 text-text-main">
            <p><strong className="text-text-secondary">Pre-Deployment:</strong> {dp.description.preDeploymentNotes}</p>
            <p><strong className="text-text-secondary">Post-Check List:</strong> {dp.description.postCheckListNotes}</p>
            <p><strong className="text-text-secondary">Test Cases:</strong> {dp.description.testCasesNotes}</p>
          </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold text-text-main mb-4">Deployment Objects ({dos.length})</h2>
        <div className="space-y-3">
          {dos.map(doItem => (
            <div
              key={doItem.id}
              onClick={() => onSelectDo(doItem.id)}
              className="bg-panel p-4 rounded-lg border border-panel-border hover:border-primary cursor-pointer transition-all duration-200 flex justify-between items-center"
            >
              <div className="flex items-center space-x-3">
                <span className={`
                    ${doItem.status === Status.Completed ? 'text-green-500' : ''}
                    ${doItem.status === Status.Failed ? 'text-red-500' : ''}
                    ${doItem.status === Status.InProgress ? 'text-purple-500 animate-pulse' : ''}
                    ${doItem.status === Status.Open ? 'text-blue-500' : ''}
                `}>
                    <DOStatusIcon status={doItem.status} />
                </span>
                <div>
                  <p className="font-semibold text-text-main">{doItem.id}: {doItem.summary}</p>
                  <p className="text-xs text-text-secondary">{doItem.type}</p>
                </div>
              </div>
              <StatusBadge status={doItem.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DPDetails;