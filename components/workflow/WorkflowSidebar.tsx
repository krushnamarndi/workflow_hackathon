"use client";

import React, { useState } from "react";
import { Type, Image as ImageIcon, Sparkles, Search, Upload, Crop } from "lucide-react";
import { NODE_TYPES } from "@/lib/workflow-types";

interface WorkflowSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSampleWorkflow?: () => void;
}

const nodeConfigs = [
  {
    type: NODE_TYPES.TEXT,
    label: "Text",
    icon: Type,
  },
  {
    type: NODE_TYPES.UPLOAD_IMAGE,
    label: "Upload Image",
    icon: Upload,
  },
  {
    type: NODE_TYPES.CROP_IMAGE,
    label: "Crop Image",
    icon: Crop,
  },
  {
    type: NODE_TYPES.IMAGE,
    label: "Image",
    icon: ImageIcon,
  },
  {
    type: NODE_TYPES.LLM,
    label: "Run Any LLM",
    icon: Sparkles,
  },
];

const sampleWorkflows = [
  { icon: ImageIcon, label: "Product Listing Generator" },
];

export default function WorkflowSidebar({ isOpen, onClose, onLoadSampleWorkflow }: WorkflowSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNodes = nodeConfigs.filter((node) =>
    node.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  if (!isOpen) return null;

  return (
    <aside className="w-[320px] border-r border-white/5 flex flex-col bg-[#1A1A1A] z-10 animate-in slide-in-from-left duration-200">

      {/* Search Bar */}
      <div className="px-5 pb-5">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0F0F0F] border border-white/10 rounded-lg py-2.5 pl-10 pr-3 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-white/20"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5">
        {/* Quick Access Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-zinc-100 mb-4">Quick access</h3>
          
          {/* Grid of Quick Access Cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {filteredNodes.map((node) => {
              const Icon = node.icon;
              return (
                <div
                  key={node.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, node.type)}
                  className="bg-[#252525] hover:bg-[#2A2A2A] border border-white/5 rounded-xl p-4 cursor-grab active:cursor-grabbing transition-all group"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#1A1A1A] border border-white/5 flex items-center justify-center">
                      <Icon size={22} className="text-zinc-400 group-hover:text-zinc-300" />
                    </div>
                    <span className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 text-center">
                      {node.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Help Text */}
          <p className="text-xs text-zinc-500 text-center leading-relaxed px-2">
            Drag nodes to the canvas or click to add at center
          </p>
        </div>

        {/* Sample Workflows Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-zinc-100 mb-4">Sample Workflows</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {sampleWorkflows.map((workflow, idx) => {
              const Icon = workflow.icon;
              return (
                <div
                  key={idx}
                  onClick={onLoadSampleWorkflow}
                  className="bg-[#252525] hover:bg-[#2A2A2A] border border-white/5 rounded-xl p-4 cursor-pointer transition-all group"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#1A1A1A] border border-white/5 flex items-center justify-center">
                      <Icon size={22} className="text-zinc-500 group-hover:text-zinc-400" />
                    </div>
                    <span className="text-xs font-medium text-zinc-300 group-hover:text-zinc-100 text-center">
                      {workflow.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {filteredNodes.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-zinc-500">No items found</p>
          </div>
        )}
      </div>
    </aside>
  );
}
