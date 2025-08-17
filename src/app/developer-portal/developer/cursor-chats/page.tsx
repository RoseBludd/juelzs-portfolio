"use client";

import { 
  DocumentTextIcon, 
  CloudArrowUpIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  TagIcon,
  CalendarIcon,
  EyeIcon,
  TrashIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface CursorChat {
  id: string;
  title: string;
  filename: string;
  file_size: number;
  tags: string[];
  project_context: string | null;
  metadata: {
    wordCount: number;
    lineCount: number;
    uploadedAt: string;
  };
  upload_date: string;
  created_at: string;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export default function CursorChatsPage() {
  const [chats, setChats] = useState<CursorChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChat, setSelectedChat] = useState<CursorChat | null>(null);
  const [selectedChatContent, setSelectedChatContent] = useState<string>('');
  const [loadingChatContent, setLoadingChatContent] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  });

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [cursorChatFile, setCursorChatFile] = useState<File | null>(null);
  const [cursorChatTitle, setCursorChatTitle] = useState('');
  const [cursorChatTags, setCursorChatTags] = useState('');
  const [cursorChatProject, setCursorChatProject] = useState('');
  const [uploadingChat, setUploadingChat] = useState(false);

  useEffect(() => {
    loadChats();
  }, [searchTerm]);

  // Separate effect for pagination changes
  useEffect(() => {
    if (pagination.offset > 0) {
      loadChats();
    }
  }, [pagination.offset]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString()
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      console.log('Loading chats with params:', params.toString());
      const response = await fetch(`/api/developer/cursor-chats?${params}`);
      const data = await response.json();

      console.log('Load chats response:', { 
        status: response.status, 
        data, 
        chatsCount: data.chats?.length 
      });

      if (response.ok) {
        setChats(data.chats || []);
        setPagination(data.pagination || { total: 0, limit: 20, offset: 0, hasMore: false });
        console.log('Chats loaded successfully:', data.chats?.length || 0);
      } else {
        console.error('Failed to load chats:', data);
        toast.error(data.error || 'Failed to load cursor chats');
      }
    } catch (error) {
      console.error('Error loading cursor chats:', error);
      toast.error('Failed to load cursor chats');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('File selected:', file?.name, file?.type, file?.size);
    if (file) {
      // Check file extension instead of MIME type since browsers don't always set correct MIME type for .md files
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.md') || fileName.endsWith('.markdown')) {
        setCursorChatFile(file);
        if (!cursorChatTitle) {
          setCursorChatTitle(file.name.replace(/\.(md|markdown)$/i, ''));
        }
        console.log('File accepted:', fileName);
      } else {
        toast.error('Please select a markdown (.md) file');
        // Clear the file input
        event.target.value = '';
        console.log('File rejected - wrong type:', fileName);
      }
    }
  };

  const handleUpload = async () => {
    console.log('Upload attempt:', { 
      hasFile: !!cursorChatFile, 
      hasTitle: !!cursorChatTitle?.trim(),
      uploading: uploadingChat 
    });
    
    if (!cursorChatFile || !cursorChatTitle?.trim()) {
      toast.error('Please select a file and provide a title');
      return;
    }

    setUploadingChat(true);
    
    try {
      const content = await cursorChatFile.text();
      const tags = cursorChatTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      console.log('Uploading with data:', {
        title: cursorChatTitle,
        filename: cursorChatFile.name,
        tagsCount: tags.length,
        contentLength: content.length
      });

      const response = await fetch('/api/developer/cursor-chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cursorChatTitle,
          filename: cursorChatFile.name,
          content,
          tags,
          projectContext: cursorChatProject || null
        }),
      });

      const result = await response.json();
      console.log('Upload response:', result);

      if (response.ok) {
        toast.success('Cursor chat uploaded successfully!');
        setShowUploadModal(false);
        setCursorChatFile(null);
        setCursorChatTitle('');
        setCursorChatTags('');
        setCursorChatProject('');
        
        // Reset pagination and force reload
        setPagination(prev => ({ ...prev, offset: 0 }));
        setTimeout(() => {
          loadChats(); // Force reload after state update
        }, 100);
      } else {
        toast.error(result.error || 'Failed to upload cursor chat');
      }
    } catch (error) {
      console.error('Error uploading cursor chat:', error);
      toast.error('Failed to upload cursor chat');
    } finally {
      setUploadingChat(false);
    }
  };

  const handleViewChat = async (chat: CursorChat) => {
    setSelectedChat(chat);
    setShowChatModal(true);
    setLoadingChatContent(true);
    setSelectedChatContent('');

    try {
      console.log('Fetching content for chat:', chat.id);
      const response = await fetch(`/api/developer/cursor-chats/${chat.id}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Chat content loaded:', { 
          contentLength: data.content?.length,
          title: data.title 
        });
        setSelectedChatContent(data.content || 'No content available');
      } else {
        const errorData = await response.json();
        console.error('Failed to load chat content:', errorData);
        setSelectedChatContent('Failed to load chat content: ' + (errorData.error || 'Unknown error'));
        toast.error('Failed to load chat content');
      }
    } catch (error) {
      console.error('Error fetching chat content:', error);
      setSelectedChatContent('Error loading chat content');
      toast.error('Error loading chat content');
    } finally {
      setLoadingChatContent(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadChat = async (chat: CursorChat) => {
    try {
      // Get the full chat content from the API
      const response = await fetch(`/api/developer/cursor-chats/${chat.id}`);
      if (response.ok) {
        const data = await response.json();
        const content = data.content;
        
        // Create and download the file
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = chat.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        toast.error('Failed to download chat');
      }
    } catch (error) {
      console.error('Error downloading chat:', error);
      toast.error('Failed to download chat');
    }
  };

  const handleCloseChatModal = () => {
    setShowChatModal(false);
    setSelectedChat(null);
    setSelectedChatContent('');
    setLoadingChatContent(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Cursor Chats</h1>
            <p className="text-gray-400 mt-2">View and manage your uploaded cursor chat conversations</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setPagination(prev => ({ ...prev, offset: 0 }));
                loadChats();
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              title="Refresh chat list"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <CloudArrowUpIcon className="w-5 h-5" />
              Upload New Chat
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search chats by title, filename, tags, or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors">
              <FunnelIcon className="w-5 h-5" />
              Filters
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{pagination.total}</div>
            <div className="text-sm text-gray-400">Total Chats</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">
              {chats.reduce((sum, chat) => sum + (chat.metadata?.wordCount || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Total Words</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">
              {formatFileSize(chats.reduce((sum, chat) => sum + chat.file_size, 0))}
            </div>
            <div className="text-sm text-gray-400">Total Size</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">
              {chats.length > 0 ? Math.round(chats.reduce((sum, chat) => sum + (chat.metadata?.wordCount || 0), 0) / chats.length) : 0}
            </div>
            <div className="text-sm text-gray-400">Avg Words</div>
          </div>
        </div>

        {/* Chat List */}
        <div className="bg-gray-800 rounded-lg">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading chats...</p>
            </div>
          ) : chats.length === 0 ? (
            <div className="p-8 text-center">
              <DocumentTextIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No cursor chats found</h3>
              <p className="text-gray-400 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Upload your first cursor chat to get started'}
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Upload Chat
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {chats.map((chat) => (
                <div key={chat.id} className="p-6 hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-white mb-2">{chat.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <DocumentTextIcon className="w-4 h-4" />
                          {chat.filename}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {formatDistanceToNow(new Date(chat.upload_date), { addSuffix: true })}
                        </span>
                        <span>{formatFileSize(chat.file_size)}</span>
                        {chat.metadata?.wordCount && (
                          <span>{chat.metadata.wordCount.toLocaleString()} words</span>
                        )}
                      </div>
                      
                      {chat.project_context && (
                        <div className="mb-3">
                          <span className="text-sm text-gray-500">Project: </span>
                          <span className="text-sm text-blue-400">{chat.project_context}</span>
                        </div>
                      )}
                      
                      {chat.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {chat.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs flex items-center gap-1"
                            >
                              <TagIcon className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleViewChat(chat)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        title="View chat"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadChat(chat)}
                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        title="Download chat"
                      >
                        <DocumentArrowDownIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="p-6 border-t border-gray-700 flex justify-between items-center">
              <span className="text-sm text-gray-400">
                Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} chats
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                  disabled={pagination.offset === 0}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                  disabled={!pagination.hasMore}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Upload Cursor Chat</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Markdown File <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".md,.markdown"
                    onChange={handleFileSelect}
                    className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                  {cursorChatFile && (
                    <div className="mt-2 text-sm text-green-400 flex items-center gap-1">
                      ✓ Selected: {cursorChatFile.name}
                    </div>
                  )}
                  {!cursorChatFile && (
                    <div className="mt-1 text-xs text-gray-500">
                      Please select a .md or .markdown file
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={cursorChatTitle}
                    onChange={(e) => setCursorChatTitle(e.target.value)}
                    className={`w-full p-2 bg-gray-700 text-white rounded border ${
                      cursorChatTitle?.trim() ? 'border-green-600' : 'border-gray-600'
                    } focus:border-blue-500 focus:outline-none`}
                    placeholder="Enter a descriptive title"
                  />
                  {cursorChatTitle?.trim() && (
                    <div className="mt-1 text-sm text-green-400">✓ Title provided</div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={cursorChatTags}
                    onChange={(e) => setCursorChatTags(e.target.value)}
                    className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    placeholder="e.g., react, typescript, debugging"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Context (optional)
                  </label>
                  <input
                    type="text"
                    value={cursorChatProject}
                    onChange={(e) => setCursorChatProject(e.target.value)}
                    className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    placeholder="Related project or task"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploadingChat || !cursorChatFile || !cursorChatTitle?.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title={
                    !cursorChatFile ? 'Please select a file' :
                    !cursorChatTitle?.trim() ? 'Please enter a title' :
                    uploadingChat ? 'Uploading...' : 
                    'Upload cursor chat'
                  }
                >
                  {uploadingChat ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CloudArrowUpIcon className="w-4 h-4" />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat View Modal */}
      {showChatModal && selectedChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedChat.title}</h3>
                <p className="text-sm text-gray-400">{selectedChat.filename}</p>
              </div>
              <button
                onClick={handleCloseChatModal}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {loadingChatContent ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-400">Loading chat content...</span>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-gray-300 font-mono text-sm leading-relaxed bg-gray-900 p-4 rounded-lg border border-gray-700 overflow-auto">
                    {selectedChatContent || 'No content available'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 