export enum Status {
  Open = "Open",
  PendingApproval = "Pending Approval",
  Approved = "Approved",
  InProgress = "In Progress",
  AwaitingDOCompletion = "Awaiting DO Completion",
  Completed = "Completed",
  Failed = "Failed",
}

export enum Priority {
    Highest = "Highest",
    High = "High",
    Medium = "Medium",
    Low = "Low",
    Lowest = "Lowest",
}

export interface BaseDO {
  id: string;
  dpId: string;
  summary: string;
  status: Status;
  priority: Priority;
  labels: string[];
  reporter: string;
  assignee?: string;
  createdDate: string;
  updatedDate: string;
}

export interface NiFiFlowDO extends BaseDO {
  type: "NiFi Flow DO";
  description: {
    flowName: string;
    action: "Deploy New" | "Update Existing";
    registryBucket: string;
    currentVersion?: string;
    newVersion: string;
    nifiRegistryUrl: string;
    associatedParameterContexts: string[];
  };
}

export interface NiFiScriptDO extends BaseDO {
  type: "NiFi Script DO";
  description: {
    scriptName: string;
    action: "Deploy New" | "Update Existing";
    scriptContent?: string;
    gitRepoUrl: string;
    gitRepoTag: string;
    targetServer: string;
    targetProcessorId?: string;
    targetScriptDirectory: string;
    relevantNiFiFlow: string;
  };
}

export interface NiFiServiceDO extends BaseDO {
  type: "NiFi Service DO";
  description: {
    serviceType: "NiFi REST" | "NiFi AI Service" | "NiFi Data Service";
    serviceName: string;
    action: "Deploy New" | "Update Existing";
    serviceClass: string;
    serviceProperties: { property: string; value: string }[];
    enabledState: "Enable" | "Disable" | "No Change";
    gitRepoUrl: string;
    gitRepoTag: string;
    targetServer: string;
  };
}

export interface NiFiS2SConfigDO extends BaseDO {
  type: "NiFi S2S Config DO";
  description: {
    remoteGroupPath: string;
    remoteInputPortName: string;
    targetNiFiUrl: string;
    securityProtocol: "HTTP" | "HTTPS";
    transportProtocol: "RAW" | "HTTP";
    batchSize: number;
    concurrentlyAvailableTasks: number;
    permissionsAction: "Add" | "Update" | "Remove" | "No Change";
    authorizedUsers: string[];
  };
}

export type DeploymentObject = NiFiFlowDO | NiFiScriptDO | NiFiServiceDO | NiFiS2SConfigDO;

export interface DeploymentPlan {
  id: string;
  summary: string;
  description: {
    projectName: string;
    brief: string;
    owner: string;
    admin: string;
    entDeveloper: string;
    user: string;
    targetCluster: string;
    preDeploymentNotes: string;
    postCheckListNotes: string;
    testCasesNotes: string;
  };
  status: Status;
  doIds: string[];
}