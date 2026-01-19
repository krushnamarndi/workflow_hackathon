"use client";

import React, { useState } from "react";
import { X, Info, Sparkles } from "lucide-react";
import { GEMINI_MODELS, type GeminiModel } from "@/lib/workflow-types";
import { useWorkflowStore } from "@/store/workflow.store";

interface NodeConfigSidebarProps {
  nodeId: string | null;
  onClose: () => void;
}

export default function NodeConfigSidebar({ nodeId, onClose }: NodeConfigSidebarProps) {
  const nodes = useWorkflowStore((state) => state.nodes);
  const updateNode = useWorkflowStore((state) => state.updateNode);

  const node = nodes.find((n) => n.id === nodeId);
  
  if (!nodeId || !node) return null;

  const nodeData = node.data;
  const selectedModel = nodeData?.model || "gemini-2.5-flash";
  const temperature = nodeData?.temperature || 1;
  const thinking = nodeData?.thinking || false;
  const systemPrompt = nodeData?.systemPrompt || "";
  const userMessage = nodeData?.userMessage || "";

  const handleModelChange = (model: GeminiModel) => {
    updateNode(nodeId, { model });
  };

  const handleTemperatureChange = (temp: number) => {
    updateNode(nodeId, { temperature: temp });
  };

  const handleThinkingChange = (enabled: boolean) => {
    updateNode(nodeId, { thinking: enabled });
  };

  const handleSystemPromptChange = (value: string) => {
    updateNode(nodeId, { systemPrompt: value });
  };

  const handleUserMessageChange = (value: string) => {
    updateNode(nodeId, { userMessage: value });
  };

  return (
    <aside className="w-[320px] border-l border-white/5 bg-[#1A1A1A] flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-zinc-400" />
          <span className="text-sm font-medium text-zinc-300">Any LLM</span>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Configuration */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Model Name */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs font-medium text-zinc-400">Model Name</label>
            <Info size={12} className="text-zinc-600" />
          </div>
          <select
            value={selectedModel}
            onChange={(e) => handleModelChange(e.target.value as GeminiModel)}
            className="w-full bg-[#2A2A2A] border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-white/20"
          >
            {GEMINI_MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.id}
              </option>
            ))}
          </select>
        </div>

        {/* Thinking */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="thinking"
              checked={thinking}
              onChange={(e) => handleThinkingChange(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-[#2A2A2A] text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
            />
            <label htmlFor="thinking" className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              Thinking
              <Info size={12} className="text-zinc-600" />
            </label>
          </div>
        </div>

        {/* Temperature */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs font-medium text-zinc-400">Temperature</label>
            <Info size={12} className="text-zinc-600" />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
            <span className="text-sm text-zinc-400 min-w-[20px]">{temperature}</span>
          </div>
        </div>

        {/* System Prompt */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs font-medium text-zinc-400">System Prompt</label>
            <Info size={12} className="text-zinc-600" />
          </div>
          <textarea
            value={systemPrompt}
            onChange={(e) => handleSystemPromptChange(e.target.value)}
            placeholder="Optional system instructions..."
            className="w-full h-24 bg-[#2A2A2A] border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-white/20 resize-none"
          />
        </div>

        {/* User Message */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs font-medium text-zinc-400">User Message</label>
            <Info size={12} className="text-zinc-600" />
          </div>
          <textarea
            value={userMessage}
            onChange={(e) => handleUserMessageChange(e.target.value)}
            placeholder="Main prompt or question..."
            className="w-full h-32 bg-[#2A2A2A] border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-white/20 resize-none"
          />
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-white/5 p-4">
        <div className="mb-4">
          <div className="text-xs font-medium text-zinc-400 mb-3">Run selected nodes</div>
          
          {/* Runs Counter */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-zinc-400">Runs</span>
            <div className="flex items-center gap-2">
              <button className="w-6 h-6 flex items-center justify-center bg-[#2A2A2A] border border-white/10 rounded text-zinc-400 hover:text-zinc-300">
                −
              </button>
              <span className="text-sm text-zinc-300 min-w-[20px] text-center">1</span>
              <button className="w-6 h-6 flex items-center justify-center bg-[#2A2A2A] border border-white/10 rounded text-zinc-400 hover:text-zinc-300">
                +
              </button>
            </div>
          </div>

          {/* Total Cost */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-zinc-400">Total cost</span>
            <div className="flex items-center gap-1 text-sm text-zinc-300">
              <Sparkles size={12} />
              <span>1 credits</span>
            </div>
          </div>
        </div>

        {/* Run Button */}
        <button className="w-full bg-[#E9FF97] hover:bg-[#E9FF97]/90 text-black px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
          → Run selected
        </button>
      </div>
    </aside>
  );
}
