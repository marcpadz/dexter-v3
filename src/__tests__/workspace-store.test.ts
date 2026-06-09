import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkspaceStore } from '@/components/workspace/workspace-store';

describe('workspace-store', () => {
  beforeEach(() => {
    // Reset store before each test
    useWorkspaceStore.setState({
      isOpen: false,
      activeTab: 'artifacts',
      panelSize: 40,
      artifacts: [],
      activeArtifactId: null,
      activities: [],
      terminalOutput: '',
    });
  });

  it('should open and close the panel', () => {
    const { open, close } = useWorkspaceStore.getState();

    expect(useWorkspaceStore.getState().isOpen).toBe(false);
    open();
    expect(useWorkspaceStore.getState().isOpen).toBe(true);
    close();
    expect(useWorkspaceStore.getState().isOpen).toBe(false);
  });

  it('should set active tab and open panel', () => {
    const { setActiveTab } = useWorkspaceStore.getState();

    setActiveTab('terminal');
    const state = useWorkspaceStore.getState();
    expect(state.activeTab).toBe('terminal');
    expect(state.isOpen).toBe(true);
  });

  it('should manage artifacts', () => {
    const { addArtifact, removeArtifact, updateArtifact } = useWorkspaceStore.getState();
    const mockArtifact = {
      id: 'test-1',
      type: 'code' as const,
      title: 'Test',
      content: 'hello',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Add
    addArtifact(mockArtifact);
    let state = useWorkspaceStore.getState();
    expect(state.artifacts.length).toBe(1);
    expect(state.activeArtifactId).toBe('test-1');
    expect(state.activeTab).toBe('artifacts');
    expect(state.isOpen).toBe(true);

    // Update
    updateArtifact('test-1', 'world');
    state = useWorkspaceStore.getState();
    expect(state.artifacts[0].content).toBe('world');

    // Remove
    removeArtifact('test-1');
    state = useWorkspaceStore.getState();
    expect(state.artifacts.length).toBe(0);
    expect(state.activeArtifactId).toBeNull();
  });

  it('should push activities and maintain FIFO size limit', () => {
    const { pushActivity } = useWorkspaceStore.getState();

    for (let i = 0; i < 60; i++) {
      pushActivity({ kind: 'info', title: `Activity ${i}` });
    }

    const state = useWorkspaceStore.getState();
    expect(state.activities.length).toBe(50); // Max limit
    // Newest is at index 0
    expect(state.activities[0].title).toBe('Activity 59');
  });

  it('should append terminal output', () => {
    const { appendTerminalOutput } = useWorkspaceStore.getState();

    appendTerminalOutput('hello ');
    appendTerminalOutput('world');

    const state = useWorkspaceStore.getState();
    expect(state.terminalOutput).toBe('hello world');
  });
});
