
import { useCallback, useEffect } from 'react';
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

// Initial Data (Mock)
const initialNodes: Node[] = [
    {
        id: 'mission-1',
        type: 'mission',
        position: { x: 400, y: 100 },
        data: {
            label: 'Outbound Campaign: Tech Startups',
            status: 'active',
            progress: 45
        },
    },
    {
        id: 'agent-1',
        type: 'agent',
        position: { x: 100, y: 300 },
        data: {
            label: 'Lead Scraper Alpha',
            role: 'Researcher',
            status: 'working',
            currentAction: 'Scraping LinkedIn Company Pages...'
        },
    },
    {
        id: 'agent-2',
        type: 'agent',
        position: { x: 400, y: 350 },
        data: {
            label: 'Email Drafter Beta',
            role: 'Copywriter',
            status: 'idle',
            currentAction: 'Waiting for leads'
        },
    },
    {
        id: 'agent-3',
        type: 'agent',
        position: { x: 700, y: 300 },
        data: {
            label: 'Outreach Coordinator',
            role: 'Manager',
            status: 'active',
            currentAction: 'Reviewing drafts'
        },
    },
];

const initialEdges: Edge[] = [
    { id: 'e1-1', source: 'mission-1', target: 'agent-1', animated: true, style: { stroke: '#6366f1' } },
    { id: 'e1-2', source: 'mission-1', target: 'agent-2', animated: true, style: { stroke: '#6366f1' } },
    { id: 'e1-3', source: 'mission-1', target: 'agent-3', animated: true, style: { stroke: '#6366f1' } },
];

const MissionMapContent = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    return (
        <div className="w-full h-full bg-black/95 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl relative group">
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <h2 className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-1">Live Operations</h2>
                <h1 className="text-zinc-100 font-bold text-xl">Spatial Mission Control</h1>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                className="bg-black/90"
            >
                <Background
                    color="#222"
                    gap={30}
                    size={1}
                    variant={BackgroundVariant.Dots}
                />
                <Controls className="!bg-zinc-900 !border-zinc-700 !fill-zinc-400" />
            </ReactFlow>

            {/* Example "Live" Effect overlay */}
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
