
import { useCallback, useEffect, useState, useRef } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    BackgroundVariant,
    ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { MissionNode, AgentNode } from './CustomNodes';

// Define Node Types
const nodeTypes = {
    mission: MissionNode,
    agent: AgentNode,
};

// Function to generate workflow based on user's objective
const generateWorkflow = (objective: string): { nodes: Node[], edges: Edge[] } => {
    const lowerObjective = objective.toLowerCase();
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Create mission node
    nodes.push({
        id: 'mission-active',
        type: 'mission',
        position: { x: 350, y: 50 },
        data: {
            label: objective.length > 35 ? objective.substring(0, 35) + '...' : objective,
            status: 'active',
            progress: 10
        },
    });

    // Determine agents based on keywords
    const agentConfigs: Array<{ id: string, label: string, role: string, action: string, x: number, y: number }> = [];

    // Researcher for finding/searching
    if (lowerObjective.includes('find') || lowerObjective.includes('target') ||
        lowerObjective.includes('search') || lowerObjective.includes('cto') ||
        lowerObjective.includes('founder') || lowerObjective.includes('hiring') ||
        lowerObjective.includes('manager') || lowerObjective.length > 5) {
        agentConfigs.push({
            id: 'agent-researcher',
            label: 'Lead Researcher',
            role: 'Researcher',
            action: 'Finding matching prospects...',
            x: 100,
            y: 250
        });
    }

    // Enricher for data
    if (lowerObjective.includes('enrich') || lowerObjective.includes('data') ||
        lowerObjective.includes('info') || lowerObjective.includes('details')) {
        agentConfigs.push({
            id: 'agent-enricher',
            label: 'Data Enricher',
            role: 'Enricher',
            action: 'Gathering prospect details...',
            x: 280,
            y: 320
        });
    }

    // Copywriter for emails
    if (lowerObjective.includes('email') || lowerObjective.includes('outreach') ||
        lowerObjective.includes('message') || lowerObjective.includes('contact') ||
        lowerObjective.includes('reach') || lowerObjective.includes('send') ||
        agentConfigs.length > 0) {
        agentConfigs.push({
            id: 'agent-copywriter',
            label: 'Email Copywriter',
            role: 'Copywriter',
            action: 'Drafting personalized emails...',
            x: 450,
            y: 270
        });
    }

    // Manager always present if there are other agents
    if (agentConfigs.length > 0 || lowerObjective.length > 3) {
        agentConfigs.push({
            id: 'agent-manager',
            label: 'Campaign Manager',
            role: 'Manager',
            action: 'Coordinating outreach...',
            x: 620,
            y: 250
        });
    }

    // Create agent nodes
    agentConfigs.forEach(config => {
        nodes.push({
            id: config.id,
            type: 'agent',
            position: { x: config.x, y: config.y },
            data: {
                label: config.label,
                role: config.role,
                status: 'working',
                currentAction: config.action
            },
        });

        // Create edge from mission to agent
        edges.push({
            id: `e-mission-${config.id}`,
            source: 'mission-active',
            target: config.id,
            animated: true,
            style: { stroke: '#6366f1', strokeWidth: 2 }
        });
    });

    return { nodes, edges };
};

const MissionMapContent = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [currentObjective, setCurrentObjective] = useState('');
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    // Listen for workflow events from HeroInput
    useEffect(() => {
        const handleShowWorkflow = (event: CustomEvent<{ show: boolean, objective?: string }>) => {
            const { show, objective } = event.detail;

            // Clear existing debounce
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }

            if (!show || !objective || objective.length < 3) {
                // Clear workflow
                setCurrentObjective('');
                setNodes([]);
                setEdges([]);
                return;
            }

            // Debounce to avoid too many updates while typing
            debounceRef.current = setTimeout(() => {
                if (objective !== currentObjective) {
                    setCurrentObjective(objective);
                    const { nodes: newNodes, edges: newEdges } = generateWorkflow(objective);
                    setNodes(newNodes);
                    setEdges(newEdges);
                }
            }, 200);
        };

        window.addEventListener('showWorkflow', handleShowWorkflow as EventListener);
        return () => {
            window.removeEventListener('showWorkflow', handleShowWorkflow as EventListener);
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [currentObjective, setNodes, setEdges]);

    return (
        <div className="w-full h-full bg-black/95 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl relative group">
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <h2 className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-1">Live Operations</h2>
                <h1 className="text-zinc-100 font-bold text-xl">Spatial Mission Control</h1>
                {nodes.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-500 font-mono">Workflow ready</span>
                    </div>
                )}
            </div>

            {nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center z-5 pointer-events-none">
                    <div className="text-center text-zinc-600">
                        <div className="text-4xl mb-3">🚀</div>
                        <p className="text-sm font-mono">Type your mission to see the workflow...</p>
                        <p className="text-xs mt-2 text-zinc-700">Agents will appear as you describe your goal</p>
                    </div>
                </div>
            )}

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                minZoom={0.5}
                maxZoom={1.5}
                className="bg-black/90"
                proOptions={{ hideAttribution: true }}
            >
                <Background
                    color="#222"
                    gap={30}
                    size={1}
                    variant={BackgroundVariant.Dots}
                />
                <Controls className="!bg-zinc-900 !border-zinc-700 !fill-zinc-400" />
            </ReactFlow>

            {/* Live Effect overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent opacity-50" />
        </div>
    );
};

export default function MissionMap() {
    return (
        <ReactFlowProvider>
            <MissionMapContent />
        </ReactFlowProvider>
    );
}
