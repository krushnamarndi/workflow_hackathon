"use client";

import React, { useState } from 'react';
import { 
  Plus, 
  FileText, 
  Users, 
  Grid, 
  MessageSquare, 
  Search, 
  LayoutGrid,
  List,
  Folder,
  Network
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ProfileDropdown from '@/components/sections/profile-dropdown';
import { trpc } from '@/lib/trpc/provider';
import { FileContextMenu } from '@/components/ui/file-context-menu';
import { NewFolderDialog } from '@/components/ui/new-folder-dialog';
import { MyFilesDropdown } from '@/components/ui/my-files-dropdown';
import { RenameDialog } from '@/components/ui/rename-dialog';
import { MoveDialog } from '@/components/ui/move-dialog';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active = false, 
  onClick,
  dropdown 
}: { 
  icon: any;
  label: string;
  active?: boolean;
  onClick?: () => void;
  dropdown?: React.ReactNode;
}) => {
  const content = (
    <div 
      className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
        active ? 'bg-[#222222] text-white' : 'text-zinc-400 hover:bg-[#1A1A1A] hover:text-white'
      }`}
      onClick={onClick}
    >
      <Icon size={18} />
      <span className="text-sm font-medium">{label}</span>
      {label === "My Files" && <Plus size={14} className="ml-auto opacity-40" />}
    </div>
  );

  if (dropdown) {
    return dropdown;
  }

  return content;
};

const WorkflowCard = ({ title, image }: { title: string, image: string }) => (
  <div className="group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer">
    <Image 
      src={image} 
      alt={title} 
      fill 
      className="object-cover transition-transform duration-300 group-hover:scale-105" 
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
    <div className="absolute bottom-4 left-4">
      <p className="text-white text-sm font-medium">{title}</p>
    </div>
  </div>
);

const FileCard = ({ 
  id,
  title, 
  date, 
  isFolder = false,
  onOpen,
  onDelete,
  onRename,
  onDuplicate,
  onMove,
}: { 
  id: string;
  title: string;
  date?: string;
  isFolder?: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onRename: () => void;
  onDuplicate?: () => void;
  onMove?: () => void;
}) => (
  <div className="flex flex-col gap-2">
    <div className="aspect-[4/5] bg-[#1A1A1A] rounded-xl flex items-center justify-center border border-white/5 hover:border-white/10 transition-colors cursor-pointer relative group">
      <div onClick={onOpen} className="flex items-center justify-center w-full h-full">
        {isFolder ? (
          <Folder size={48} className="text-zinc-600" />
        ) : (
          <Network size={40} className="text-zinc-600" />
        )}
      </div>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <FileContextMenu
          itemId={id}
          itemName={title}
          isFolder={isFolder}
          onOpen={onOpen}
          onOpenNewTab={() => window.open(isFolder ? `/folder/${id}` : `/workflow/${id}`, '_blank')}
          onRename={onRename}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onMove={onMove}
        />
      </div>
    </div>
    <div>
      <p className="text-white text-sm font-medium truncate">{title}</p>
      {date && <p className="text-zinc-500 text-xs">{date}</p>}
    </div>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('Workflow library');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; id: string; name: string; type: 'workflow' | 'folder' } | null>(null);
  const [moveDialog, setMoveDialog] = useState<{ open: boolean; id: string; name: string; type: 'workflow' | 'folder'; folderId: string | null; folderName?: string } | null>(null);

  // Fetch root folders and workflows
  const { data: rootData, isLoading, refetch } = trpc.folder.listRoot.useQuery();

  // Search query
  const { data: searchResults } = trpc.folder.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  // Mutations
  const createWorkflow = trpc.workflow.create.useMutation({
    onSuccess: (data) => {
      router.push(`/workflow/${data.id}`);
    },
  });

  const createFolder = trpc.folder.create.useMutation({
    onSuccess: () => {
      setShowNewFolderDialog(false);
      refetch();
    },
  });

  const deleteWorkflow = trpc.workflow.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteFolder = trpc.folder.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const duplicateWorkflow = trpc.workflow.duplicate.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('Workflow duplicated successfully');
    },
  });

  const handleCreateFile = () => {
    createWorkflow.mutate({
      name: 'Untitled Workflow',
      description: '',
      data: { nodes: [], edges: [] },
    });
  };

  const handleCreateFolder = (name: string) => {
    createFolder.mutate({ name });
  };

  const displayItems = searchQuery.length > 0 ? searchResults : rootData;

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-white font-sans overflow-hidden">
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 border-r border-white/5 flex flex-col p-4 gap-6 shrink-0 bg-[#0A0A0A] z-50 transition-transform duration-300 ${
        isMobile ? `fixed inset-y-0 left-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}` : ''
      }`}>
        <ProfileDropdown />

        <button 
          onClick={handleCreateFile}
          disabled={createWorkflow.isPending}
          className="flex items-center justify-center gap-2 bg-[#E9FF97] text-black w-full py-2.5 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Plus size={18} />
          {createWorkflow.isPending ? 'Creating...' : 'Create New File'}
        </button>

        <nav className="flex flex-col gap-1">
          <MyFilesDropdown
            onNewFile={handleCreateFile}
            onNewFolder={() => setShowNewFolderDialog(true)}
          >
            <div>
              <SidebarItem icon={FileText} label="My Files" active />
            </div>
          </MyFilesDropdown>
          <SidebarItem icon={Users} label="Shared with me" />
          <SidebarItem icon={Grid} label="Apps" />
        </nav>

        <div className="mt-auto">
          <SidebarItem icon={MessageSquare} label="Discord" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="flex items-center justify-between p-4 md:p-8">
          <div className="flex items-center gap-4">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 10H17M3 5H17M3 15H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
            <h1 className="text-xl font-medium text-zinc-300"> Workspace</h1>
          </div>
          <button 
            onClick={handleCreateFile}
            disabled={createWorkflow.isPending}
            className="flex items-center gap-2 bg-[#E9FF97] text-black px-3 py-2 md:px-4 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">{createWorkflow.isPending ? 'Creating...' : 'Create New File'}</span>
            <span className="sm:hidden">{createWorkflow.isPending ? '...' : 'New'}</span>
          </button>
        </header>

        <div className="px-4 md:px-8 flex flex-col gap-6 md:gap-8 pb-12">
          {/* Top Selection */}
          <div className="bg-[#121212] p-6 rounded-2xl border border-white/5">
            <div className="flex gap-6 mb-6">
              {['Workflow library', 'Tutorials'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-sm font-medium transition-colors ${activeTab === tab ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              <WorkflowCard title="Weavy Welcome" image="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400" />
              <WorkflowCard title="Weavy Iterators" image="https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=400" />
              <WorkflowCard title="Multiple Image Models" image="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=400" />
              <WorkflowCard title="Editing Images" image="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=400" />
              <WorkflowCard title="Compositor Node" image="https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&q=80&w=400" />
              <WorkflowCard title="Image to Video" image="https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=400" />
            </div>
          </div>

          {/* My Files Section */}
          <section>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-base md:text-lg font-medium">My files</h2>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input 
                    type="text" 
                    placeholder="Search" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#121212] border border-white/5 rounded-lg py-1.5 pl-10 pr-4 text-sm w-32 sm:w-48 md:w-64 focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
                <div className="flex items-center bg-[#121212] rounded-lg border border-white/5 p-1">
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1 ${viewMode === 'list' ? 'bg-[#222222] text-white rounded' : 'text-zinc-500 hover:text-white'}`}
                  >
                    <List size={18} />
                  </button>
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1 ${viewMode === 'grid' ? 'bg-[#222222] text-white rounded' : 'text-zinc-500 hover:text-white'}`}
                  >
                    <LayoutGrid size={18} />
                  </button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="text-zinc-500">Loading...</div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                {displayItems?.folders?.map((folder: any) => (
                  <FileCard
                    key={folder.id}
                    id={folder.id}
                    title={folder.name}
                    isFolder
                    onOpen={() => router.push(`/folder/${folder.id}`)}
                    onDelete={() => deleteFolder.mutate({ id: folder.id })}
                    onRename={() => setRenameDialog({ open: true, id: folder.id, name: folder.name, type: 'folder' })}
                    onDuplicate={() => {}}
                    onMove={() => setMoveDialog({ open: true, id: folder.id, name: folder.name, type: 'folder', folderId: folder.parentId, folderName: 'Dashboard' })}
                  />
                ))}
                {displayItems?.workflows?.map((workflow: any) => (
                  <FileCard
                    key={workflow.id}
                    id={workflow.id}
                    title={workflow.name}
                    date={`Last edited ${new Date(workflow.updatedAt).toLocaleDateString()}`}
                    onOpen={() => router.push(`/workflow/${workflow.id}`)}
                    onDelete={() => deleteWorkflow.mutate({ id: workflow.id })}
                    onRename={() => setRenameDialog({ open: true, id: workflow.id, name: workflow.name, type: 'workflow' })}
                    onDuplicate={() => duplicateWorkflow.mutate({ id: workflow.id })}
                    onMove={() => setMoveDialog({ open: true, id: workflow.id, name: workflow.name, type: 'workflow', folderId: workflow.folderId, folderName: workflow.folderId ? 'Folder' : 'Dashboard' })}
                  />
                ))}
                {(!displayItems?.folders?.length && !displayItems?.workflows?.length) && (
                  <div className="col-span-6 text-center text-zinc-500 py-12">
                    No files or folders yet
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#121212] rounded-xl border border-white/5 overflow-hidden overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-6 py-3 text-xs font-medium text-zinc-400">Name</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-zinc-400">Files</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-zinc-400">Last modified</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-zinc-400">Created at</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayItems?.folders?.map((folder: any) => (
                      <tr
                        key={folder.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/folder/${folder.id}`)}>
                            <div className="w-12 h-12 bg-[#1A1A1A] rounded-lg flex items-center justify-center">
                              <Folder size={24} className="text-zinc-600" />
                            </div>
                            <span className="text-sm font-medium text-white">{folder.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-400">
                          {folder._count?.children || 0} File{folder._count?.children !== 1 ? 's' : ''}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-400">
                          {new Date(folder.updatedAt).toLocaleString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-400">
                          {new Date(folder.createdAt).toLocaleString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <FileContextMenu
                              itemId={folder.id}
                              itemName={folder.name}
                              isFolder
                              onOpen={() => router.push(`/folder/${folder.id}`)}
                              onOpenNewTab={() => window.open(`/folder/${folder.id}`, '_blank')}
                              onRename={() => setRenameDialog({ open: true, id: folder.id, name: folder.name, type: 'folder' })}
                              onDelete={() => deleteFolder.mutate({ id: folder.id })}
                              onMove={() => setMoveDialog({ open: true, id: folder.id, name: folder.name, type: 'folder', folderId: folder.parentId, folderName: 'Dashboard' })}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {displayItems?.workflows?.map((workflow: any) => (
                      <tr
                        key={workflow.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/workflow/${workflow.id}`)}>
                            <div className="w-12 h-12 bg-[#1A1A1A] rounded-lg flex items-center justify-center">
                              <Network size={24} className="text-zinc-600" />
                            </div>
                            <span className="text-sm font-medium text-white">{workflow.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-400">-</td>
                        <td className="px-6 py-4 text-sm text-zinc-400">
                          {new Date(workflow.updatedAt).toLocaleString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-400">
                          {new Date(workflow.createdAt).toLocaleString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <FileContextMenu
                              itemId={workflow.id}
                              itemName={workflow.name}
                              isFolder={false}
                              onOpen={() => router.push(`/workflow/${workflow.id}`)}
                              onOpenNewTab={() => window.open(`/workflow/${workflow.id}`, '_blank')}
                              onRename={() => setRenameDialog({ open: true, id: workflow.id, name: workflow.name, type: 'workflow' })}
                              onDelete={() => deleteWorkflow.mutate({ id: workflow.id })}
                              onDuplicate={() => duplicateWorkflow.mutate({ id: workflow.id })}
                              onMove={() => setMoveDialog({ open: true, id: workflow.id, name: workflow.name, type: 'workflow', folderId: workflow.folderId, folderName: workflow.folderId ? 'Folder' : 'Dashboard' })}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!displayItems?.folders?.length && !displayItems?.workflows?.length) && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                          No files or folders yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      <NewFolderDialog
        open={showNewFolderDialog}
        onOpenChange={setShowNewFolderDialog}
        onCreateFolder={handleCreateFolder}
        isCreating={createFolder.isPending}
      />

      {renameDialog && (
        <RenameDialog
          open={renameDialog.open}
          onOpenChange={(open) => setRenameDialog(open ? renameDialog : null)}
          itemId={renameDialog.id}
          itemName={renameDialog.name}
          itemType={renameDialog.type}
          onSuccess={refetch}
        />
      )}

      {moveDialog && (
        <MoveDialog
          open={moveDialog.open}
          onOpenChange={(open) => setMoveDialog(open ? moveDialog : null)}
          itemId={moveDialog.id}
          itemName={moveDialog.name}
          itemType={moveDialog.type}
          currentFolderId={moveDialog.folderId}
          currentFolderName={moveDialog.folderName}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
