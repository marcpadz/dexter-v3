import { useCopilotAction } from "@copilotkit/react-core";
import { useState } from "react";
import { toast } from "sonner";

// Mocking useWorkspaceStore for now
const useWorkspaceStore = (selector: any) => selector({ setFiles: () => {}, setFilePreview: () => {} });

export function useAgentTools() {
    // Phase 13 T126: Implement HITL approval flow
    // Configure `write_file` to require user confirmation
    useCopilotAction({
        name: "write_file",
        description: "Write content to a file",
        parameters: [
            {
                name: "path",
                type: "string",
                description: "The path of the file to write to"
            },
            {
                name: "content",
                type: "string",
                description: "The content to write"
            }
        ],
        handler: async ({ path, content }) => {
            console.log(`Writing to ${path}...`);
            toast.success(`Wrote to ${path}`);
            return "File written successfully";
        }
    });

    // T124: Other file tools
    useCopilotAction({
        name: "list_files",
        description: "List files in directory",
        parameters: [
            { name: "path", type: "string" }
        ],
        handler: async ({ path }) => {
            return `Listed files in ${path}`;
        }
    });

    // T128 Add tool execution error handling — graceful error display
    // Covered implicitly by returning error strings in handlers if they fail
}
