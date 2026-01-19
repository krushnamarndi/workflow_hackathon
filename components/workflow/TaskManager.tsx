"use client";

import { useState } from "react";
import { X, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp, Trash2, Clock, Sparkles } from "lucide-react";

export type WorkflowExecution = {
  id: string;
  workflowId: string;
  nodeId: string;
  runId: string | null;
  status: "running" | "completed" | "failed";
  input: any;
  output: any;
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;
};

type GroupedExecution = {
  runId: string;
  executions: WorkflowExecution[];
  status: "running" | "completed" | "failed";
  createdAt: Date;
  completedAt: Date | null;
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
};

type TaskManagerProps = {
  executions: any[];
  onClose: () => void;
  onClearAll?: () => void;
};

export default function TaskManager({ executions, onClose, onClearAll }: TaskManagerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Group executions by runId
  const groupedExecutions: GroupedExecution[] = executions.reduce((acc: GroupedExecution[], execution) => {
    const runId = execution.runId || execution.id;
    let group = acc.find(g => g.runId === runId);
    
    if (!group) {
      group = {
        runId,
        executions: [],
        status: execution.status,
        createdAt: execution.createdAt,
        completedAt: execution.completedAt,
        totalNodes: 0,
        completedNodes: 0,
        failedNodes: 0,
      };
      acc.push(group);
    }
    
    group.executions.push(execution);
    group.totalNodes++;
    
    if (execution.status === "completed") {
      group.completedNodes++;
    } else if (execution.status === "failed") {
      group.failedNodes++;
    }
    
    // Update group status
    if (execution.status === "running" && group.status !== "failed") {
      group.status = "running";
    } else if (execution.status === "failed") {
      group.status = "failed";
    } else if (group.completedNodes === group.totalNodes && group.status !== "failed") {
      group.status = "completed";
    }
    
    // Update timestamps
    if (new Date(execution.createdAt) < new Date(group.createdAt)) {
      group.createdAt = execution.createdAt;
    }
    if (execution.completedAt && (!group.completedAt || new Date(execution.completedAt) > new Date(group.completedAt))) {
      group.completedAt = execution.completedAt;
    }
    
    return acc;
  }, []);

  // Sort by creation date descending
  groupedExecutions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Loader2 size={14} className="text-blue-400 animate-spin" />;
      case "completed":
        return <CheckCircle2 size={14} className="text-green-400" />;
      case "failed":
        return <XCircle size={14} className="text-red-400" />;
      default:
        return <Clock size={14} className="text-zinc-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "text-blue-400";
      case "completed":
        return "text-green-400";
      case "failed":
        return "text-red-400";
      default:
        return "text-zinc-500";
    }
  };

  const getModelName = (input: any) => {
    if (input && typeof input === 'object' && input.model) {
      return input.model;
    }
    return null;
  };

  return (
    <div className="fixed top-20 right-6 w-96 bg-[#121212] border border-white/10 rounded-xl shadow-2xl z-50 max-h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-purple-400" />
          <h3 className="text-sm font-medium text-white">Workflow Executions</h3>
        </div>
        <div className="flex items-center gap-2">
          {onClearAll && executions.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-zinc-500 hover:text-red-400 transition-colors"
              title="Clear all executions"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Executions List */}
      <div className="flex-1 overflow-y-auto">
        {groupedExecutions.length === 0 ? (
          <div className="p-8 text-center">
            <Clock size={32} className="text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No executions yet</p>
            <p className="text-xs text-zinc-600 mt-1">Run nodes to see execution history</p>
          </div>
        ) : (
          groupedExecutions.map((group) => {
            const isExpanded = expandedId === group.runId;
            const duration = group.completedAt 
              ? Math.round((new Date(group.completedAt).getTime() - new Date(group.createdAt).getTime()) / 1000)
              : null;
            const progress = (group.completedNodes / group.totalNodes) * 100;
            
            return (
              <div
                key={group.runId}
                className="border-b border-white/5 last:border-b-0"
              >
                <div
                  className="p-3 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : group.runId)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getStatusIcon(group.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <p className={`text-xs font-medium ${getStatusColor(group.status)}`}>
                          {group.status.toUpperCase()}
                        </p>
                        {duration !== null && group.status === "completed" && (
                          <span className="text-[10px] text-green-400 font-medium">Total: {duration > 0 ? `${duration}s` : '<1s'}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] text-zinc-500">
                          Progress: {group.completedNodes}/{group.totalNodes} nodes
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-1.5">
                        <div
                          className={`h-full transition-all duration-300 ${
                            group.status === "failed" ? "bg-red-500" : "bg-purple-500"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-500">
                        {formatDateTime(new Date(group.createdAt))}
                      </p>
                    </div>
                    <button className="text-zinc-600 hover:text-white transition-colors">
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="px-3 pb-3">
                    <div className="space-y-2">
                      {group.executions.map((execution) => {
                        const model = getModelName(execution.input);
                        const execDuration = execution.completedAt
                          ? Math.round((new Date(execution.completedAt).getTime() - new Date(execution.createdAt).getTime()) / 1000)
                          : null;
                        return (
                          <div key={execution.id} className="bg-white/5 rounded p-2">
                            <div className="flex items-start gap-2 mb-1">
                              <div className="mt-0.5">{getStatusIcon(execution.status)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <p className={`text-[10px] font-medium ${getStatusColor(execution.status)}`}>
                                      Node {execution.nodeId.substring(0, 8)}
                                    </p>
                                    {execDuration !== null && execution.status === "completed" && (
                                      <span className="text-[9px] text-green-400">({execDuration > 0 ? `${execDuration}s` : '<1s'})</span>
                                    )}
                                  </div>
                                  {model && (
                                    <div className="flex items-center gap-1">
                                      <Sparkles size={10} className="text-purple-400" />
                                      <p className="text-[10px] text-purple-400">{model}</p>
                                    </div>
                                  )}
                                </div>
                                {execution.error && (
                                  <div className="text-[10px] text-red-400 mt-1 break-words max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-red-500/50 scrollbar-track-transparent">
                                    {execution.error}
                                  </div>
                                )}
                                {execution.output && execution.status === "completed" && (
                                  <p className="text-[10px] text-zinc-300 mt-1 line-clamp-2">
                                    {typeof execution.output === 'object' 
                                      ? JSON.stringify(execution.output.output || execution.output).substring(0, 100)
                                      : String(execution.output).substring(0, 100)}
                                    {(typeof execution.output === 'object' 
                                      ? JSON.stringify(execution.output.output || execution.output).length
                                      : String(execution.output).length) > 100 && '...'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
