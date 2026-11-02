import { useCallback, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { toast } from "sonner"
import { ArrowLeft, Loader2, Play, Plus, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { whatsAppFlowService, type WhatsAppFlow } from "@/services/whatsAppFlowService"
import { nodeTypes, NODE_META, NODE_PALETTE, type FlowNodeType } from "@/components/WhatsApp/flow-nodes/nodeTypes"
import { NodeSettingsPanel } from "@/components/WhatsApp/flow-nodes/NodeSettingsPanel"

let nodeIdCounter = 1
function makeNodeId() {
  return `node_${Date.now()}_${nodeIdCounter++}`
}

export default function WhatsAppFlowEditorPage() {
  const { id } = useParams()
  const { data: flow, isLoading } = useQuery({
    queryKey: ["whatsapp-flow", id],
    queryFn: () => whatsAppFlowService.getFlowById(id!),
    enabled: !!id,
  })

  if (isLoading || !flow) {
    return <div className="p-8 text-center text-muted-foreground">Loading chatbot...</div>
  }
  // keyed so the editor starts with the loaded chatbot already on the canvas (and fits it to the screen)
  return <FlowEditor key={flow.id} flow={flow} />
}

function FlowEditor({ flow }: { flow: WhatsAppFlow }) {
  const id = flow.id
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [nodes, setNodes] = useState<Node[]>(() =>
    flow.nodes?.length > 0
      ? flow.nodes
      : [{ id: makeNodeId(), type: "message", position: { x: 250, y: 50 }, data: { ...NODE_META.message.defaultData } }]
  )
  const [edges, setEdges] = useState<Edge[]>(() => (flow.nodes?.length > 0 ? flow.edges || [] : []))
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [flowName, setFlowName] = useState(flow.name)
  const [isActive, setIsActive] = useState(flow.isActive)
  const [keywords, setKeywords] = useState((flow.triggerKeywords || []).join(", "))
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [testPhone, setTestPhone] = useState("")

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds))
  }, [])

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds))
  }, [])

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge(connection, eds))
  }, [])

  const addNode = (type: FlowNodeType) => {
    const newNode: Node = {
      id: makeNodeId(),
      type,
      position: { x: 250 + Math.random() * 200, y: 150 + nodes.length * 120 },
      data: { ...NODE_META[type].defaultData },
    }
    setNodes((nds) => [...nds, newNode])
  }

  const updateNodeData = (nodeId: string, data: Record<string, any>) => {
    setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data } : n)))
  }

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId))
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
    setSelectedNodeId(null)
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      whatsAppFlowService.updateFlow(id, {
        name: flowName,
        nodes,
        edges,
        isActive,
        ...(flow.triggerType === "keyword" ? { triggerKeywords: keywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean) } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-flow", id] })
      queryClient.invalidateQueries({ queryKey: ["whatsapp-flows"] })
      toast.success("Flow saved")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to save flow")
    },
  })

  const testMutation = useMutation({
    mutationFn: () => whatsAppFlowService.testFlow(id, testPhone),
    onSuccess: () => {
      toast.success("Test flow started - check the number on WhatsApp")
      setTestDialogOpen(false)
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || "Failed to start test")
    },
  })

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null

  return (
    <div className="flex h-full min-h-[480px] overflow-hidden bg-background">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 border-b p-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/whatsapp/chatbot")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            className="max-w-xs font-medium"
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            placeholder="Flow name"
          />
          <div className="flex items-center gap-2 ml-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <span className="text-sm text-muted-foreground">{isActive ? "Active" : "Inactive"}</span>
          </div>
          {flow.triggerType === "keyword" && (
            <Input
              className="max-w-xs"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Trigger keywords, comma separated"
              title="The chatbot starts when a customer's message contains one of these words"
            />
          )}

          <div className="flex-1" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" /> Add Node
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {NODE_PALETTE.map((type) => {
                const meta = NODE_META[type]
                return (
                  <DropdownMenuItem key={type} onClick={() => addNode(type)}>
                    <meta.icon className="h-4 w-4 mr-2" /> {meta.label}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" onClick={() => setTestDialogOpen(true)}>
            <Play className="h-4 w-4 mr-2" /> Test
          </Button>

          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </div>

        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
            style={{ width: "100%", height: "100%" }}
          >
            <Background />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </div>
      </div>

      {selectedNode && (
        <NodeSettingsPanel
          node={selectedNode}
          onChange={updateNodeData}
          onClose={() => setSelectedNodeId(null)}
          onDelete={deleteNode}
        />
      )}

      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Test this flow</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Input
              placeholder="+1234567890"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Save the flow first so the test uses your latest changes. This sends the flow's opening message
              to this number right now.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => testMutation.mutate()} disabled={testMutation.isPending || !testPhone}>
              {testMutation.isPending ? "Starting..." : "Start Test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
