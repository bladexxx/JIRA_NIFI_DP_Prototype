import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DeploymentObject, Status, Priority, NiFiFlowDO, NiFiScriptDO, NiFiServiceDO, NiFiS2SConfigDO } from '../types';
import { StatusBadge } from './StatusBadge';
import { CodeBlock } from './CodeBlock';
import { DeployObjectIcon, PriorityIcon, UserAvatarIcon, EditIcon, CloseIcon } from './icons';

interface DODetailsModalProps {
  doItem: DeploymentObject;
  onClose: () => void;
  onRun: (doId: string) => void;
  onUpdate: (doItem: DeploymentObject) => void;
}

const REGISTRY_BUCKETS = ["default_bucket", "datalake_bucket", "autospa_bucket", "billing_bucket", "shared_services_bucket"];
const PARAM_CONTEXTS = ["prod_autospa_params", "common_db_config", "uat_datalake_params", "dev_billing_config", "global_error_handling"];


const WORKFLOW_STEPS = [Status.Open, Status.PendingApproval, Status.Approved, Status.InProgress, Status.Completed];

// ... (other components like WorkflowStatusBar, DetailItem, FormInput, FormSelect remain the same)
const WorkflowStatusBar: React.FC<{ currentStatus: Status }> = ({ currentStatus }) => {
    const currentIndex = WORKFLOW_STEPS.indexOf(currentStatus);
    const isFailed = currentStatus === Status.Failed;

    return (
        <div className="flex items-center text-xs text-text-secondary font-semibold">
            {WORKFLOW_STEPS.map((step, index) => (
                <React.Fragment key={step}>
                    <div className="flex items-center">
                        <span className={`px-2 py-1 rounded ${index <= currentIndex ? 'bg-blue-100 text-primary' : 'bg-gray-100'}`}>
                            {step}
                        </span>
                    </div>
                    {index < WORKFLOW_STEPS.length - 1 && (
                        <div className="flex-1 h-px bg-gray-300 mx-2"></div>
                    )}
                </React.Fragment>
            ))}
            {isFailed && (
                 <>
                    <div className="flex-1 h-px bg-gray-300 mx-2"></div>
                    <div className="flex items-center">
                        <span className="px-2 py-1 rounded bg-red-100 text-status-red-text">{Status.Failed}</span>
                    </div>
                 </>
            )}
        </div>
    );
};

const DetailItem: React.FC<{ label: string; value?: React.ReactNode, children?: React.ReactNode, className?: string }> = ({ label, value, children, className }) => (
  <div className={`flex flex-col py-2 ${className}`}>
    <dt className="text-sm font-semibold text-text-secondary">{label}</dt>
    <dd className="mt-1 text-sm text-text-main">{value}{children}</dd>
  </div>
);

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className={`mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${props.className}`} />
);

const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className={`mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${props.className}`}>
        {props.children}
    </select>
);

const SearchableSelect: React.FC<{ options: string[], value: string, onChange: (value: string) => void }> = ({ options, value, onChange }) => {
    const [searchTerm, setSearchTerm] = useState(value);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()));

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm(value); // Reset search term if clicked outside
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef, value]);

    const handleSelect = (option: string) => {
        onChange(option);
        setSearchTerm(option);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <FormInput 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                onFocus={() => setIsOpen(true)}
                autoComplete="off"
            />
            {isOpen && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                    {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                        <li key={opt} onClick={() => handleSelect(opt)} className="px-3 py-2 text-sm text-text-main hover:bg-gray-100 cursor-pointer">
                            {opt}
                        </li>
                    )) : <li className="px-3 py-2 text-sm text-text-secondary">No results found</li>}
                </ul>
            )}
        </div>
    );
};

const MultiSelect: React.FC<{ options: string[], selected: string[], onChange: (selected: string[]) => void }> = ({ options, selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const availableOptions = options.filter(opt => !selected.includes(opt));
    
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
    
    const handleSelect = (option: string) => {
        onChange([...selected, option]);
    };
    
    const handleRemove = (option: string) => {
        onChange(selected.filter(s => s !== option));
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="mt-1 flex flex-wrap items-center gap-2 p-2 min-h-[42px] bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                {selected.map(opt => (
                    <span key={opt} className="bg-status-blue text-status-blue-text text-xs font-semibold px-2 py-1 rounded-full flex items-center">
                        {opt}
                        <button onClick={(e) => { e.stopPropagation(); handleRemove(opt); }} className="ml-2 text-status-blue-text hover:text-primary">&times;</button>
                    </span>
                ))}
                {!selected.length && <span className="text-gray-400">Select options...</span>}
            </div>
             {isOpen && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                    {availableOptions.map(opt => (
                        <li key={opt} onClick={() => handleSelect(opt)} className="px-3 py-2 text-sm text-text-main hover:bg-gray-100 cursor-pointer">
                            {opt}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}


const DODetailsModal: React.FC<DODetailsModalProps> = ({ doItem, onClose, onRun, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableDo, setEditableDo] = useState<DeploymentObject>(doItem);

  const isRunnable = doItem.status === Status.Open || doItem.status === Status.Approved;

  const handleInputChange = (field: keyof DeploymentObject | `description.${string}`, value: any) => {
    setEditableDo(prev => {
      if (typeof field === 'string' && field.startsWith('description.')) {
        const descField = field.split('.')[1];
        switch (prev.type) {
            case 'NiFi Flow DO':
                return { ...prev, description: { ...prev.description, [descField]: value } };
            case 'NiFi Script DO':
                return { ...prev, description: { ...prev.description, [descField]: value } };
            case 'NiFi Service DO':
                return { ...prev, description: { ...prev.description, [descField]: value } };
            case 'NiFi S2S Config DO':
                 const numFields = ['batchSize', 'concurrentlyAvailableTasks'];
                 const parsedValue = numFields.includes(descField) ? parseInt(value, 10) || 0 : value;
                return { ...prev, description: { ...prev.description, [descField]: parsedValue } };
            default:
                return prev;
        }
      }
      return { ...prev, [field]: value };
    });
  };
  
  const handleSave = () => {
    // Version validation for NiFi Flow DO
    if (editableDo.type === 'NiFi Flow DO') {
      const versionRegex = /^\d+\.\d+(\.\d+)?$/;
      if (!versionRegex.test(editableDo.description.newVersion)) {
        alert('Invalid version format for "New Version". Please use a valid format like 1.0 or 1.2.3');
        return;
      }
    }
      
    let tempDo = { ...editableDo };
    try {
        if(tempDo.type === 'NiFi Service DO' && typeof tempDo.description.serviceProperties === 'string') {
            tempDo = {...tempDo, description: {...tempDo.description, serviceProperties: JSON.parse(tempDo.description.serviceProperties)}};
        }
    } catch (error) {
        alert('Invalid JSON format in Service Properties.');
        return;
    }
    onUpdate(tempDo);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditableDo(doItem);
    setIsEditing(false);
  };
  
  const renderDetailsFields = () => {
    const currentData = isEditing ? editableDo : doItem;
    
    const renderField = (label, value, fieldName, type='text', options=[]) => (
        <DetailItem label={label}>
            {isEditing ? (
                type === 'select' ? (
                    <FormSelect value={value} onChange={e => handleInputChange(`description.${fieldName}`, e.target.value)}>
                        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </FormSelect>
                ) : (
                    <FormInput 
                        value={value} 
                        onChange={e => handleInputChange(`description.${fieldName}`, e.target.value)} 
                        type={type}
                    />
                )
            ) : (
                <span>{value}</span>
            )}
        </DetailItem>
    );

    return <div className="grid grid-cols-2 gap-x-4">
        {(() => {
            switch (currentData.type) {
                case 'NiFi Flow DO':
                    const flowData = currentData.description;
                    return <>
                        {renderField("Flow Name", flowData.flowName, 'flowName')}
                        {renderField("Action", flowData.action, 'action', 'select', ["Deploy New", "Update Existing"])}
                        
                        <DetailItem label="Registry Bucket" className="col-span-2">
                            {isEditing ? (
                                <SearchableSelect
                                    options={REGISTRY_BUCKETS}
                                    value={flowData.registryBucket}
                                    onChange={val => handleInputChange('description.registryBucket', val)}
                                />
                            ) : <span>{flowData.registryBucket}</span>}
                        </DetailItem>
                        
                        {renderField("Current Version", flowData.currentVersion || '', 'currentVersion')}
                        {renderField("New Version", flowData.newVersion, 'newVersion')}
                        {renderField("NiFi Registry URL", flowData.nifiRegistryUrl, 'nifiRegistryUrl')}
                        
                         <DetailItem label="Parameter Contexts" className="col-span-2">
                             {isEditing ? (
                                <MultiSelect
                                    options={PARAM_CONTEXTS}
                                    selected={flowData.associatedParameterContexts}
                                    onChange={val => handleInputChange('description.associatedParameterContexts', val)}
                                />
                             ) : <span>{flowData.associatedParameterContexts.join(', ')}</span>}
                         </DetailItem>
                    </>
                case 'NiFi Script DO':
                    const scriptData = currentData.description;
                    return <>
                        {renderField("Script Name", scriptData.scriptName, 'scriptName')}
                        {renderField("Action", scriptData.action, 'action', 'select', ["Deploy New", "Update Existing"])}
                        {renderField("Git Repo URL", scriptData.gitRepoUrl, 'gitRepoUrl')}
                        {renderField("Git Repo Tag", scriptData.gitRepoTag, 'gitRepoTag')}
                        {renderField("Target Server", scriptData.targetServer, 'targetServer')}
                        {renderField("Target Processor ID", scriptData.targetProcessorId || '', 'targetProcessorId')}
                        {renderField("Target Script Directory", scriptData.targetScriptDirectory, 'targetScriptDirectory')}
                        {renderField("Relevant NiFi Flow", scriptData.relevantNiFiFlow, 'relevantNiFiFlow')}
                        <div className="col-span-2">
                             <CodeBlock title="Script Content (Optional)" data={{}} isEditable={isEditing} content={scriptData.scriptContent} onChange={(val) => handleInputChange('description.scriptContent', val)} />
                        </div>
                    </>
                case 'NiFi Service DO':
                    const serviceData = currentData.description;
                    return <>
                        {renderField("Service Type", serviceData.serviceType, 'serviceType', 'select', ["NiFi REST", "NiFi AI Service", "NiFi Data Service"])}
                        {renderField("Service Name", serviceData.serviceName, 'serviceName')}
                        {renderField("Action", serviceData.action, 'action', 'select', ["Deploy New", "Update Existing"])}
                        {renderField("Git Repo URL", serviceData.gitRepoUrl, 'gitRepoUrl')}
                        {renderField("Git Repo Tag", serviceData.gitRepoTag, 'gitRepoTag')}
                        {renderField("Target Server", serviceData.targetServer, 'targetServer')}
                        {renderField("Service Class", serviceData.serviceClass, 'serviceClass')}
                        {renderField("Enabled State", serviceData.enabledState, 'enabledState', 'select', ["Enable", "Disable", "No Change"])}
                         <div className="col-span-2">
                            <CodeBlock title="Service Properties" data={serviceData.serviceProperties} isEditable={isEditing} content={typeof serviceData.serviceProperties === 'string' ? serviceData.serviceProperties : JSON.stringify(serviceData.serviceProperties, null, 2)} onChange={(val) => handleInputChange('description.serviceProperties', val)} />
                        </div>
                    </>
                case 'NiFi S2S Config DO':
                    const s2sData = currentData.description;
                    return <>
                        {renderField("Remote Group Path", s2sData.remoteGroupPath, 'remoteGroupPath')}
                        {renderField("Remote Input Port Name", s2sData.remoteInputPortName, 'remoteInputPortName')}
                        {renderField("Target NiFi URL", s2sData.targetNiFiUrl, 'targetNiFiUrl')}
                        {renderField("Security Protocol", s2sData.securityProtocol, 'securityProtocol', 'select', ["HTTP", "HTTPS"])}
                        {renderField("Transport Protocol", s2sData.transportProtocol, 'transportProtocol', 'select', ["RAW", "HTTP"])}
                        {renderField("Batch Size", s2sData.batchSize, 'batchSize', 'number')}
                        {renderField("Concurrently Available Tasks", s2sData.concurrentlyAvailableTasks, 'concurrentlyAvailableTasks', 'number')}
                        {renderField("Permissions Action", s2sData.permissionsAction, 'permissionsAction', 'select', ["Add", "Update", "Remove", "No Change"])}
                        <DetailItem label="Authorized Users" className="col-span-2">
                             {isEditing ? (
                                <FormInput 
                                    value={s2sData.authorizedUsers.join(', ')} 
                                    onChange={e => handleInputChange(`description.authorizedUsers`, e.target.value.split(',').map(s => s.trim()))}
                                    placeholder="comma, separated, users"
                                />
                            ) : (
                                <span>{s2sData.authorizedUsers.join(', ')}</span>
                            )}
                        </DetailItem>
                    </>
                default: return null;
            }
        })()}
    </div>
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 transition-opacity pt-10" onClick={onClose}>
      <div className="bg-background rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-panel-border">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-sm text-text-secondary">
                    <DeployObjectIcon className="h-5 w-5" />
                    <span>Deploy Object / {doItem.id}</span>
                </div>
                <div className="flex items-center space-x-4">
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="flex items-center space-x-1 text-sm text-text-secondary hover:bg-gray-200 p-2 rounded">
                            <EditIcon/> <span>Edit</span>
                        </button>
                    )}
                    <button onClick={onClose} className="text-text-secondary hover:bg-gray-200 p-1 rounded-full"><CloseIcon/></button>
                </div>
            </div>
             {isEditing ? (
                <FormInput value={editableDo.summary} onChange={e => handleInputChange('summary', e.target.value)} className="text-2xl font-bold mt-2 w-full" />
            ) : (
                <h2 className="text-2xl font-bold text-text-main mt-2">{doItem.summary}</h2>
            )}
        </div>
        
        {/* Actions & Workflow */}
        <div className="px-6 py-4 border-b border-panel-border">
            <div className="flex justify-between items-center">
                <div>
                     <button
                        onClick={() => onRun(doItem.id)}
                        disabled={!isRunnable || isEditing}
                        className={`font-semibold ${isRunnable && !isEditing ? 'bg-primary hover:bg-primary-hover' : 'bg-gray-300 cursor-not-allowed'} text-white py-2 px-4 rounded transition-colors duration-200 text-sm`}
                      >
                        {doItem.status === Status.InProgress ? 'Running...' : 'Run DO'}
                      </button>
                </div>
                <div className="w-2/3">
                    <WorkflowStatusBar currentStatus={doItem.status} />
                </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-3 gap-6">
          {/* Left Panel */}
          <div className="col-span-2 space-y-4">
            <h3 className="text-lg font-semibold text-text-main">Details</h3>
            <div className="grid grid-cols-2 gap-x-4">
                <DetailItem label="Type" value={<><DeployObjectIcon className="h-4 w-4 inline mr-1"/>{doItem.type}</>} />
                <DetailItem label="Priority">
                    {isEditing ? (
                        <FormSelect value={editableDo.priority} onChange={e => handleInputChange('priority', e.target.value as Priority)}>
                            {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                        </FormSelect>
                    ) : (
                        <><PriorityIcon priority={doItem.priority} className="h-4 w-4 inline mr-1"/>{doItem.priority}</>
                    )}
                </DetailItem>
                <DetailItem label="Labels" className="col-span-2">
                    {isEditing ? (
                        <FormInput 
                            value={editableDo.labels.join(', ')} 
                            onChange={e => handleInputChange('labels', e.target.value.split(',').map(s => s.trim()))}
                            placeholder="comma, separated, labels"
                        />
                    ) : (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {doItem.labels.map(label => <span key={label} className="bg-gray-200 text-text-secondary text-xs px-2 py-0.5 rounded">{label}</span>)}
                        </div>
                    )}
                </DetailItem>
                <DetailItem label="Deployment Plan" value={<a href="#" className="text-text-link hover:underline">{doItem.dpId}</a>} />
            </div>
            <div className="border-t border-panel-border pt-4">
                {renderDetailsFields()}
            </div>
          </div>

          {/* Right Panel */}
          <div className="col-span-1 space-y-4">
             <div className="border-b border-panel-border pb-4">
                 <h3 className="text-sm font-semibold text-text-secondary mb-2">Status</h3>
                 <StatusBadge status={doItem.status} />
             </div>
             <div>
                <h3 className="text-sm font-semibold text-text-secondary mb-2">People</h3>
                <DetailItem label="Assignee">
                    {isEditing ? (
                        <FormInput value={editableDo.assignee || ''} onChange={e => handleInputChange('assignee', e.target.value)} placeholder="Unassigned" />
                    ) : (
                        <div className="flex items-center space-x-2">
                            <UserAvatarIcon /> <span>{doItem.assignee || 'Unassigned'}</span>
                        </div>
                    )}
                </DetailItem>
                <DetailItem label="Reporter">
                    {isEditing ? (
                         <FormInput value={editableDo.reporter} onChange={e => handleInputChange('reporter', e.target.value)} />
                    ) : (
                        <div className="flex items-center space-x-2">
                            <UserAvatarIcon /> <span>{doItem.reporter}</span>
                        </div>
                    )}
                </DetailItem>
             </div>
             <div>
                <h3 className="text-sm font-semibold text-text-secondary mb-2">Dates</h3>
                <DetailItem label="Created" value={new Date(doItem.createdDate).toLocaleString()} />
                <DetailItem label="Updated" value={new Date(doItem.updatedDate).toLocaleString()} />
             </div>
          </div>
        </div>

         {/* Footer */}
        {isEditing && (
            <div className="flex justify-end p-4 border-t border-panel-border bg-gray-50 rounded-b-lg">
              <button onClick={handleCancel} className="bg-gray-200 hover:bg-gray-300 text-text-main font-bold py-2 px-4 rounded transition-colors duration-200">
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="ml-3 bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded transition-colors duration-200"
              >
                Save
              </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default DODetailsModal;