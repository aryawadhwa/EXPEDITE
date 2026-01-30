
import { useState, useCallback, useEffect } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    MarkerType,
    Node,
    ReactFlowProvider,
    Handle,
    Position,
    NodeProps,
    BackgroundVariant,
    useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Save, Play, Puzzle, Box, ArrowLeft, Key, Code, Trash2, Edit, MoreVertical, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { integrations, Integration } from '@/lib/integrations';
import { toast } from 'sonner';

const STORAGE_KEY = 'deploy-agent-workflow';

// --- Integration Node ---
interface IntegrationNodeData extends Record<string, unknown> {
    label: string;
    description: string;
    apiKey: string;
    logo?: string;
}
type IntegrationNodeType = Node<IntegrationNodeData>;

const IntegrationNode = ({ id, data }: NodeProps<IntegrationNodeType>) => {
    const [apiKey, setApiKey] = useState(data.apiKey || '');
    const { setNodes } = useReactFlow();

    const handleDelete = () => {
        setNodes((nodes) => nodes.filter((n) => n.id !== id));
        toast.info("Node deleted");
    };

    const handleEdit = () => {
        toast.info("Editing " + data.label);
        // In a real app, this might open a detailed modal
    };

    return (
        <Card className="min-w-[200px] bg-zinc-900 border-2 border-zinc-800 shadow-xl group">
            <div className="p-3 bg-zinc-800/50 border-b border-zinc-800 flex items-center justify-between rounded-t-lg">
                <div className="flex items-center gap-2">
                    {data.logo ? (
                        <img src={data.logo} alt={data.label} className="w-4 h-4 object-contain" />
                    ) : (
                        <Puzzle className="w-4 h-4 text-indigo-400" />
                    )}
                    <span className="font-semibold text-sm text-zinc-100">{data.label}</span>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 nodrag">
                            <MoreVertical className="w-3 h-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-100">
                        <DropdownMenuItem onClick={handleEdit} className="focus:bg-zinc-800 focus:text-zinc-100 cursor-pointer">
                            <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDelete} className="focus:bg-red-900/50 focus:text-red-200 text-red-400 cursor-pointer">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="p-3 space-y-3">
                <div className="relative">
                    <Input
                        type="password"
                        placeholder="API Key"
                        className="h-8 text-xs pr-8 bg-zinc-950 border-zinc-800 text-zinc-300 placeholder:text-zinc-600 focus-visible:ring-indigo-500 nodrag"
                        value={apiKey}
                        onChange={(e) => {
                            setApiKey(e.target.value);
                            data.apiKey = e.target.value;
                        }}
                    />
                    <Key className="w-3 h-3 absolute right-2.5 top-2.5 text-zinc-600" />
                </div>
                <p className="text-[10px] text-zinc-400">{data.description}</p>
            </div>
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-indigo-500 border-2 border-zinc-900" />
            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-indigo-500 border-2 border-zinc-900" />
        </Card>
    );
};

// --- Custom Code Node ---
interface CustomCodeNodeData extends Record<string, unknown> {
    code: string;
}
type CustomCodeNodeType = Node<CustomCodeNodeData>;

const CustomCodeNode = ({ id, data }: NodeProps<CustomCodeNodeType>) => {
    const [code, setCode] = useState(data.code || '');
    const { setNodes } = useReactFlow();

    const handleDelete = () => {
        setNodes((nodes) => nodes.filter((n) => n.id !== id));
        toast.info("Code block deleted");
    };

    return (
        <Card className="min-w-[300px] bg-zinc-900 border-2 border-zinc-800 shadow-xl group">
            <div className="p-3 bg-zinc-800/50 border-b border-zinc-800 flex items-center justify-between rounded-t-lg">
                <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-sm text-zinc-100">Python Script</span>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 nodrag">
                            <MoreVertical className="w-3 h-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-100">
                        <DropdownMenuItem onClick={handleDelete} className="focus:bg-red-900/50 focus:text-red-200 text-red-400 cursor-pointer">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="p-3">
                <Textarea
                    placeholder="# Write your Python code here..."
                    className="bg-zinc-950 border-zinc-800 text-zinc-300 font-mono text-xs min-h-[100px] resize-y focus-visible:ring-emerald-500 nodrag"
                    value={code}
                    onChange={(e) => {
                        setCode(e.target.value);
                        data.code = e.target.value;
                    }}
                />
            </div>
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-emerald-500 border-2 border-zinc-900" />
            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-500 border-2 border-zinc-900" />
        </Card>
    );
};

// --- Condition Node (If/Else) ---
interface ConditionNodeData extends Record<string, unknown> {
    condition: string;
}
type ConditionNodeType = Node<ConditionNodeData>;

const ConditionNode = ({ id, data }: NodeProps<ConditionNodeType>) => {
    const [condition, setCondition] = useState(data.condition || '');
    const { setNodes } = useReactFlow();

    const handleDelete = () => {
        setNodes((nodes) => nodes.filter((n) => n.id !== id));
        toast.info("Condition block deleted");
    };

    return (
        <Card className="min-w-[220px] bg-zinc-900 border-2 border-indigo-600/50 shadow-xl group">
            <div className="p-3 bg-indigo-900/30 border-b border-indigo-700/50 flex items-center justify-between rounded-t-lg">
                <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold text-sm text-zinc-100">If / Else</span>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 nodrag">
                            <MoreVertical className="w-3 h-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-100">
                        <DropdownMenuItem onClick={handleDelete} className="focus:bg-red-900/50 focus:text-red-200 text-red-400 cursor-pointer">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="p-3 space-y-3">
                <Input
                    placeholder="Enter condition..."
                    className="h-8 text-xs bg-zinc-950 border-zinc-800 text-zinc-300 placeholder:text-zinc-600 focus-visible:ring-indigo-500 nodrag"
                    value={condition}
                    onChange={(e) => {
                        setCondition(e.target.value);
                        data.condition = e.target.value;
                    }}
                />
                <div className="flex justify-between text-[10px] px-1">
                    <span className="text-emerald-400 font-medium">✓ True</span>
                    <span className="text-red-400 font-medium">✗ False</span>
                </div>
            </div>
            {/* Input handle */}
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-indigo-500 border-2 border-zinc-900" />
            {/* True output handle */}
            <Handle
                type="source"
                position={Position.Right}
                id="true"
                style={{ top: '45%' }}
                className="w-3 h-3 bg-emerald-500 border-2 border-zinc-900"
            />
            {/* False output handle */}
            <Handle
                type="source"
                position={Position.Right}
                id="false"
                style={{ top: '75%' }}
                className="w-3 h-3 bg-red-500 border-2 border-zinc-900"
            />
        </Card>
    );
};

const nodeTypes = {
    integration: IntegrationNode,
    customCode: CustomCodeNode,
    condition: ConditionNode,
};

let id = 1;
const getId = () => `node_${id++}`;

// Load saved state from localStorage
const loadSavedState = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('Failed to load saved workflow:', e);
    }
    return null;
};

const DeployAgentContent = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    // Load saved state
    const savedState = loadSavedState();
    const [agentName, setAgentName] = useState(savedState?.agentName || 'My Agent');

    // Initial Nodes
    const defaultNodes: Node[] = [
        {
            id: 'start',
            type: 'input',
            data: { label: 'Start Trigger' },
            position: { x: 50, y: 150 },
            className: 'bg-zinc-900 border-2 border-zinc-700 rounded-lg px-4 py-3 font-bold min-w-[120px] text-center shadow-lg text-zinc-100',
        },
    ];

    const [nodes, setNodes, onNodesChange] = useNodesState(savedState?.nodes || defaultNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(savedState?.edges || []);

    // Save state to localStorage when it changes
    useEffect(() => {
        const state = { nodes, edges, agentName };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [nodes, edges, agentName]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({
            ...params,
            markerEnd: { type: MarkerType.ArrowClosed },
            animated: true,
            style: { stroke: '#6366f1', strokeWidth: 2 }
        }, eds)),
        [setEdges],
    );

    const onDragStart = (event: React.DragEvent, type: string, data?: unknown) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify({ type, data }));
        event.dataTransfer.effectAllowed = 'move';
    };

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const reactFlowBounds = document.querySelector('.react-flow')?.getBoundingClientRect();
            const flowData = event.dataTransfer.getData('application/reactflow');

            if (!flowData || !reactFlowBounds) return;

            const { type, data } = JSON.parse(flowData);
            const position = {
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            };

            const newNode: Node = {
                id: getId(),
                type: type,
                position,
                data: data || {}, // Initialize data based on type
            };

            if (type === 'customCode') {
                newNode.data = { code: '' };
            } else if (type === 'condition') {
                newNode.data = { condition: '' };
            } else if (type === 'integration') {
                newNode.data = {
                    label: data.name,
                    description: data.description,
                    apiKey: '',
                    logo: data.logo
                };
            }

            setNodes((nds) => nds.concat(newNode));
        },
        [setNodes],
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const filteredIntegrations = integrations.filter(i =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleClearCanvas = () => {
        // Reset to default state with only Start Trigger
        const defaultNode: Node = {
            id: 'start',
            type: 'input',
            data: { label: 'Start Trigger' },
            position: { x: 50, y: 150 },
            className: 'bg-zinc-900 border-2 border-zinc-700 rounded-lg px-4 py-3 font-bold min-w-[120px] text-center shadow-lg text-zinc-100',
        };
        setNodes([defaultNode]);
        setEdges([]);
        setAgentName('My Agent');
        localStorage.removeItem(STORAGE_KEY);
        toast.success("Canvas cleared!");
    };

    const handleDeploy = async () => {
        const payload = {
            name: agentName,
            workflow: { nodes, edges },
            integrations: nodes.filter(n => n.type === 'integration').map(n => n.data.label),
            api_keys: Object.fromEntries(
                nodes
                    .filter(n => n.type === 'integration' && n.data.apiKey)
                    .map(n => [n.data.label as string, n.data.apiKey as string])
            )
        }
        console.log('Deploying Agent:', payload);
        toast.success("Agent deployed successfully!");
        // TODO: Call API to create agent
        navigate('/agents');
    };

    return (
        <div className="h-screen w-full flex flex-col bg-black">
            {/* Top Bar */}
            <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur z-20">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/agents')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <Input
                            value={agentName}
                            onChange={e => setAgentName(e.target.value)}
                            className="h-8 font-semibold text-lg border-none bg-transparent hover:bg-muted/50 p-2 w-[250px]"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-destructive" onClick={handleClearCanvas}>
                        <RotateCcw className="w-4 h-4" /> Clear
                    </Button>
                    <Button variant="outline" className="gap-2">
                        <Save className="w-4 h-4" /> Save Draft
                    </Button>
                    <Button onClick={handleDeploy} className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20">
                        <Play className="w-4 h-4 fill-current" /> Deploy Agent
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-80 border-r border-border bg-card flex flex-col z-10 shadow-lg">
                    <div className="p-4 border-b border-border space-y-3">
                        <h3 className="font-semibold text-sm text-foreground/80">Component Library</h3>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search integrations..."
                                className="pl-9 bg-muted/50"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-6">
                            {/* Logic Nodes */}
                            <div>
                                <h4 className="text-xs font-semibold text-muted-foreground mb-3 tracking-wider uppercase">Logic & Flow</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div
                                        className="p-3 bg-muted/30 border border-border rounded-lg cursor-grab hover:border-primary/50 transition-colors flex flex-col items-center gap-2 text-center"
                                        draggable
                                        onDragStart={(e) => onDragStart(e, 'customCode')}
                                    >
                                        <Code className="w-5 h-5 text-emerald-500" />
                                        <span className="text-xs font-medium">Python Code</span>
                                    </div>
                                    <div
                                        className="p-3 bg-muted/30 border border-border rounded-lg cursor-grab hover:border-primary/50 transition-colors flex flex-col items-center gap-2 text-center"
                                        draggable
                                        onDragStart={(e) => onDragStart(e, 'condition')}
                                    >
                                        <Box className="w-5 h-5 text-indigo-500" />
                                        <span className="text-xs font-medium">If / Else</span>
                                    </div>
                                    <div
                                        className="p-3 bg-muted/30 border border-border rounded-lg cursor-grab hover:border-primary/50 transition-colors flex flex-col items-center gap-2 text-center"
                                        draggable
                                        onDragStart={(e) => onDragStart(e, 'customCode')}
                                    >
                                        <Box className="w-5 h-5 text-emerald-500" />
                                        <span className="text-xs font-medium">Loop</span>
                                    </div>
                                </div>
                            </div>

                            {/* Integrations List */}
                            {['Communication', 'Project Management', 'Developer Tools', 'CRM', 'Intelligence', 'Storage', 'Social'].map(category => {
                                const categoryItems = filteredIntegrations.filter(i => i.category.includes(category) || (category === 'Intelligence' && i.category === 'Intelligence'));
                                if (categoryItems.length === 0) return null;
                                return (
                                    <div key={category}>
                                        <h4 className="text-xs font-semibold text-muted-foreground mb-3 tracking-wider uppercase">{category}</h4>
                                        <div className="space-y-2">
                                            {categoryItems.map(integration => (
                                                <div
                                                    key={integration.id}
                                                    className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg cursor-grab hover:border-primary/50 hover:shadow-sm transition-all group"
                                                    draggable
                                                    onDragStart={(e) => onDragStart(e, 'integration', integration)}
                                                >
                                                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors p-1.5">
                                                        {integration.logo ? (
                                                            <img src={integration.logo} alt={integration.name} className="w-full h-full object-contain" />
                                                        ) : (
                                                            <Puzzle className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium leading-none mb-1">{integration.name}</div>
                                                        <div className="text-[10px] text-muted-foreground truncate">{integration.description}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>

                {/* Canvas */}
                <div className="flex-1 bg-black relative">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-black"
                    >
                        <Background
                            color="#333"
                            gap={20}
                            size={1}
                            variant={BackgroundVariant.Dots}
                        />
                        <Controls className="!bg-zinc-900 !border-zinc-700 !shadow-lg" />
                    </ReactFlow>

                    {nodes.length === 1 && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none opacity-40">
                            <Puzzle className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                            <h3 className="text-xl font-bold text-zinc-500">Start Building</h3>
                            <p className="text-zinc-600">Drag and drop integrations from the sidebar to create your agent's workflow</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function DeployAgent() {
    return (
        <ReactFlowProvider>
            <DeployAgentContent />
        </ReactFlowProvider>
    )
}
