export interface WorkspaceTab {
    id: string;
    type: string;
    title: string;
}

export interface ArtifactType {}
export interface Artifact {}
export interface WorkspaceFile {}
export interface WorkspaceActivity {}
export interface Conversation {}
export interface Message {}
export interface Document {}
export interface Project {}
export interface ApiKey {}
export interface Memory {}

export interface McpServer {
    id: string;
    userId: string;
    name: string;
    transportType: "stdio" | "sse" | string;
    command?: string;
    url?: string;
    args?: string[] | any;
    env?: Record<string, string> | any;
    enabled: boolean;
    createdAt: Date;
}
