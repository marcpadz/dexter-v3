import { create } from 'zustand';

export type WorkspaceTab =
  | 'artifacts'
  | 'browser'
  | 'document'
  | 'terminal'
  | 'files'
  | 'agent-output'
  | 'knowledgebase';

export type ArtifactType =
  | 'code'
  | 'html'
  | 'svg'
  | 'react'
  | 'image'
  | 'diff'
  | 'mermaid';

export interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  content: string;
  language?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceFile {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  modifiedAt: string;
}

export interface WorkspaceActivity {
  id: string;
  kind: 'info' | 'success' | 'error' | 'action';
  title: string;
  detail?: string;
  timestamp: number;
}

export type BrowserStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface WorkspaceState {
  // Panel state
  isOpen: boolean;
  activeTab: WorkspaceTab;
  panelSize: number;

  // Artifacts
  artifacts: Artifact[];
  activeArtifactId: string | null;

  // Browser
  browserUrl: string;
  browserStatus: BrowserStatus;
  browserScreenshot: string | null;

  // Document
  documentContent: string;
  documentTitle: string;
  documentId: string | null;

  // Terminal
  terminalSessionId: string | null;
  terminalOutput: string;

  // Files
  files: WorkspaceFile[];
  currentPath: string | null;
  selectedFilePath: string | null;

  // Agent Output
  agentOutputStream: string;
  agentOutputMetadata: Record<string, unknown>;

  // Activity log
  activities: WorkspaceActivity[];

  // Actions
  open: (tab?: WorkspaceTab) => void;
  close: () => void;
  setActiveTab: (tab: WorkspaceTab) => void;
  setPanelSize: (size: number) => void;

  addArtifact: (artifact: Artifact) => void;
  removeArtifact: (id: string) => void;
  updateArtifact: (id: string, content: string) => void;
  setActiveArtifact: (id: string) => void;

  setBrowserUrl: (url: string) => void;
  setBrowserStatus: (status: BrowserStatus) => void;
  setBrowserScreenshot: (screenshot: string | null) => void;

  setDocumentContent: (content: string) => void;
  setDocumentTitle: (title: string) => void;
  setDocumentId: (id: string | null) => void;

  setTerminalSessionId: (id: string | null) => void;
  appendTerminalOutput: (output: string) => void;

  setFiles: (files: WorkspaceFile[]) => void;
  setCurrentPath: (path: string | null) => void;
  setSelectedFilePath: (path: string | null) => void;

  appendAgentOutput: (content: string) => void;
  clearAgentOutput: () => void;

  pushActivity: (entry: Omit<WorkspaceActivity, 'id' | 'timestamp'>) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  isOpen: false,
  activeTab: 'artifacts',
  panelSize: 40,

  artifacts: [],
  activeArtifactId: null,

  browserUrl: 'about:blank',
  browserStatus: 'idle',
  browserScreenshot: null,

  documentContent: '',
  documentTitle: 'Untitled',
  documentId: null,

  terminalSessionId: null,
  terminalOutput: '',

  files: [],
  currentPath: null,
  selectedFilePath: null,

  agentOutputStream: '',
  agentOutputMetadata: {},

  activities: [],

  open: (tab) => set(() => ({ isOpen: true, ...(tab ? { activeTab: tab } : {}) })),
  close: () => set({ isOpen: false }),
  setActiveTab: (tab) => set({ activeTab: tab, isOpen: true }),
  setPanelSize: (size) => set({ panelSize: size }),

  addArtifact: (artifact) =>
    set((state) => {
      const existingIdx = state.artifacts.findIndex((a) => a.id === artifact.id);
      const newArtifacts = [...state.artifacts];
      if (existingIdx !== -1) {
        newArtifacts[existingIdx] = artifact;
      } else {
        newArtifacts.push(artifact);
      }
      return {
        artifacts: newArtifacts,
        activeArtifactId: artifact.id,
        activeTab: 'artifacts',
        isOpen: true,
      };
    }),
  removeArtifact: (id) =>
    set((state) => ({
      artifacts: state.artifacts.filter((a) => a.id !== id),
      activeArtifactId: state.activeArtifactId === id ? null : state.activeArtifactId,
    })),
  updateArtifact: (id, content) =>
    set((state) => ({
      artifacts: state.artifacts.map((a) =>
        a.id === id ? { ...a, content, updatedAt: Date.now() } : a
      ),
    })),
  setActiveArtifact: (id) => set({ activeArtifactId: id, activeTab: 'artifacts', isOpen: true }),

  setBrowserUrl: (url) => set({ browserUrl: url }),
  setBrowserStatus: (status) => set({ browserStatus: status }),
  setBrowserScreenshot: (screenshot) => set({ browserScreenshot: screenshot }),

  setDocumentContent: (content) => set({ documentContent: content }),
  setDocumentTitle: (title) => set({ documentTitle: title }),
  setDocumentId: (id) => set({ documentId: id }),

  setTerminalSessionId: (id) => set({ terminalSessionId: id }),
  appendTerminalOutput: (output) =>
    set((state) => ({ terminalOutput: state.terminalOutput + output })),

  setFiles: (files) => set({ files }),
  setCurrentPath: (path) => set({ currentPath: path }),
  setSelectedFilePath: (path) => set({ selectedFilePath: path }),

  appendAgentOutput: (content) =>
    set((state) => ({ agentOutputStream: state.agentOutputStream + content })),
  clearAgentOutput: () => set({ agentOutputStream: '' }),

  pushActivity: (entry) =>
    set((state) => {
      const newActivity: WorkspaceActivity = {
        ...entry,
        id: generateId(),
        timestamp: Date.now(),
      };
      const newActivities = [newActivity, ...state.activities].slice(0, 50);
      return { activities: newActivities };
    }),
}));
