import React, { useState, useEffect } from 'react';
import { DeploymentPlan, DeploymentObject, Status } from './types';
import { mockDps, mockDos } from './data/mockData';
import DPDashboard from './components/DPDashboard';
import DPDetails from './components/DPDetails';
import DODetailsModal from './components/DODetailsModal';

const App: React.FC = () => {
  const [dps, setDps] = useState<DeploymentPlan[]>([]);
  const [dos, setDos] = useState<DeploymentObject[]>([]);
  const [selectedDpId, setSelectedDpId] = useState<string | null>(null);
  const [selectedDoId, setSelectedDoId] = useState<string | null>(null);

  useEffect(() => {
    // Simulate fetching data
    setDps(mockDps);
    setDos(mockDos);
  }, []);

  const handleApproveDp = (dpId: string) => {
    setDps(dps.map(dp => dp.id === dpId ? { ...dp, status: Status.Approved } : dp));
  };
  
  const handleRunDo = (doId: string) => {
    const doItem = dos.find(d => d.id === doId);
    if (!doItem) return;

    // Set DO to In Progress
    setDos(prevDos => prevDos.map(d => d.id === doId ? { ...d, status: Status.InProgress } : d));
    
    // Set parent DP to Awaiting...
    const dpId = doItem.dpId;
    setDps(prevDps => prevDps.map(dp => dp.id === dpId ? {...dp, status: Status.AwaitingDOCompletion} : dp));
    
    // Simulate async operation
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success rate
      const newStatus = success ? Status.Completed : Status.Failed;
      setDos(prevDos => {
        const newDos = prevDos.map(d => d.id === doId ? { ...d, status: newStatus } : d);
        
        // Use a callback with setDps to get the latest state of dos for calculation
        setDps(currentDps => {
            const dpToUpdate = currentDps.find(dp => dp.id === dpId);
            if (!dpToUpdate) return currentDps;

            const associatedDos = newDos.filter(d => d.dpId === dpId);
            let newDpStatus = dpToUpdate.status;

            if (associatedDos.some(d => d.status === Status.Failed)) {
                newDpStatus = Status.Failed;
            } else if (associatedDos.every(d => d.status === Status.Completed)) {
                newDpStatus = Status.Completed;
            } else {
                newDpStatus = Status.AwaitingDOCompletion;
            }
            
            return currentDps.map(dp => dp.id === dpId ? {...dp, status: newDpStatus} : dp);
        });

        return newDos;
      });
    }, 2000 + Math.random() * 1500);
  };
  
  const handleUpdateDo = (updatedDo: DeploymentObject) => {
    setDos(dos.map(d => d.id === updatedDo.id ? { ...updatedDo, updatedDate: new Date().toISOString() } : d));
    setSelectedDoId(updatedDo.id); // Keep modal open with updated data
  };

  const selectedDp = dps.find(dp => dp.id === selectedDpId);
  const associatedDos = dos.filter(d => d.dpId === selectedDpId);
  const selectedDo = dos.find(d => d.id === selectedDoId);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-panel p-4 shadow-sm border-b border-panel-border">
        <h1 className="text-xl font-bold text-text-main">JIRA NiFi Deployment Prototype</h1>
      </header>
      <main className="p-4 md:p-8">
        {!selectedDp ? (
          <DPDashboard dps={dps} onSelectDp={setSelectedDpId} />
        ) : (
          <DPDetails
            dp={selectedDp}
            dos={associatedDos}
            onBack={() => setSelectedDpId(null)}
            onApprove={handleApproveDp}
            onSelectDo={setSelectedDoId}
          />
        )}
        {selectedDo && (
            <DODetailsModal 
                doItem={selectedDo} 
                onClose={() => setSelectedDoId(null)}
                onRun={handleRunDo}
                onUpdate={handleUpdateDo}
            />
        )}
      </main>
    </div>
  );
};

export default App;