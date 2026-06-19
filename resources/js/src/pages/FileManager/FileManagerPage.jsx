// FILE: resources/js/src/pages/FileManager/FileManagerPage.jsx
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload, Trash2, Copy, Image, FileText, Code2, Folder, FolderOpen,
  Grid3X3, List, Search, HardDrive, X, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { ConfirmModal } from '../../components/ui/Modal';

const FOLDERS = [
  { key: 'all',       label: 'All Files',   icon: FolderOpen },
  { key: 'logos',     label: 'Logos',       icon: Folder },
  { key: 'backgrounds', label: 'Backgrounds', icon: Folder },
  { key: 'banners',   label: 'Banners',     icon: Folder },
  { key: 'templates', label: 'Templates',   icon: Folder },
  { key: 'documents', label: 'Documents',   icon: Folder },
];

const TYPE_FILTERS = [
  { value: 'all',       label: 'All Types' },
  { value: 'image',     label: 'Images' },
  { value: 'document',  label: 'Documents' },
  { value: 'template',  label: 'Templates' },
];

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileType(filename) {
  if (!filename) return 'document';
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp'].includes(ext)) return 'image';
  if (['html', 'htm'].includes(ext)) return 'template';
  return 'document';
}

function FileIcon({ filename, className }) {
  const type = getFileType(filename);
  if (type === 'image') return <Image className={className} />;
  if (type === 'template') return <Code2 className={className} />;
  return <FileText className={className} />;
}

// Storage usage bar
function StorageBar({ used, total }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const color = pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-500' : 'bg-blue-600';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 dark:text-slate-400 flex items-center gap-1">
          <HardDrive className="h-3.5 w-3.5" /> Storage
        </span>
        <span className="font-medium text-gray-700 dark:text-slate-200">
          {formatBytes(used)} / {formatBytes(total)}
        </span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-400 dark:text-slate-500">{pct.toFixed(1)}% used</p>
    </div>
  );
}

// File card (grid view)
function FileCard({ file, onDelete, onCopy }) {
  const [copied, setCopied] = useState(false);
  const isImage = getFileType(file.filename || file.name) === 'image';

  function handleCopy() {
    const url = file.url || file.path;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="group relative border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
      {/* Thumbnail */}
      <div className="relative h-32 bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
        {isImage && file.url ? (
          <img src={file.url} alt={file.filename || file.name} className="w-full h-full object-cover" />
        ) : (
          <FileIcon filename={file.filename || file.name} className="h-10 w-10 text-gray-400 dark:text-slate-500" />
        )}
        {/* Hover actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/40 text-white transition-colors"
            title="Copy URL"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
          <button
            onClick={() => onDelete(file)}
            className="p-2 rounded-lg bg-red-500/70 hover:bg-red-600/90 text-white transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {/* Info */}
      <div className="p-2.5 space-y-0.5">
        <p className="text-xs font-medium text-gray-700 dark:text-slate-200 truncate" title={file.filename || file.name}>
          {file.filename || file.name}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400 dark:text-slate-500">{formatBytes(file.size)}</span>
          {file.folder && <Badge variant="default" className="text-[10px]">{file.folder}</Badge>}
        </div>
        {file.created_at && (
          <p className="text-[10px] text-gray-300 dark:text-slate-600">
            {new Date(file.created_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

// File row (list view)
function FileRow({ file, onDelete, onCopy }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(file.url || file.path).then(() => {
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {getFileType(file.filename || file.name) === 'image' && file.url ? (
            <img src={file.url} alt="" className="w-8 h-8 object-cover rounded flex-shrink-0" />
          ) : (
            <FileIcon filename={file.filename || file.name} className="h-5 w-5 text-gray-400 dark:text-slate-500 flex-shrink-0" />
          )}
          <span className="text-sm text-gray-700 dark:text-slate-200 truncate max-w-48">{file.filename || file.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-gray-400 dark:text-slate-500">{file.folder || '—'}</td>
      <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">{formatBytes(file.size)}</td>
      <td className="px-4 py-3 text-xs text-gray-400 dark:text-slate-500">
        {file.created_at ? new Date(file.created_at).toLocaleDateString() : '—'}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Button size="xs" variant="secondary" onClick={handleCopy}>
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'URL'}
          </Button>
          <Button size="xs" variant="danger" onClick={() => onDelete(file)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

// Drag & drop upload zone
function UploadZone({ folder, onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  async function uploadFiles(files) {
    if (!files.length) return;
    setUploading(true);
    let success = 0;
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', folder === 'all' ? 'uploads' : folder);
        await api.post('/file-manager/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        success++;
      }
      toast.success(`${success} file(s) uploaded`);
      onUploaded();
    } catch {
      toast.error('Some files failed to upload');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
        dragging
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 bg-gray-50 dark:bg-slate-800'
      }`}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); uploadFiles(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
    >
      <Upload className="h-8 w-8 text-gray-400 dark:text-slate-500 mx-auto mb-2" />
      <p className="text-sm font-medium text-gray-600 dark:text-slate-300">
        {uploading ? 'Uploading…' : 'Drop files here or click to upload'}
      </p>
      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">PNG, JPG, SVG, PDF, HTML — Max 10MB per file</p>
      <input ref={inputRef} type="file" className="hidden" multiple accept="image/*,.pdf,.html,.htm" onChange={e => uploadFiles(e.target.files)} />
    </div>
  );
}

export default function FileManagerPage() {
  const qc = useQueryClient();
  const [activeFolder, setActiveFolder] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['file-manager', activeFolder],
    queryFn: () => api.get('/file-manager', { params: { folder: activeFolder !== 'all' ? activeFolder : undefined } }).then(r => r.data),
  });

  const files = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  const storage = data?.storage || { used: 0, total: 1073741824 }; // default 1GB

  const deleteMutation = useMutation({
    mutationFn: (filename) => api.delete(`/file-manager/${encodeURIComponent(filename)}`),
    onSuccess: () => {
      toast.success('File deleted');
      qc.invalidateQueries({ queryKey: ['file-manager'] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete file'),
  });

  const filtered = files.filter(f => {
    const name = f.filename || f.name || '';
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || getFileType(name) === typeFilter;
    return matchSearch && matchType;
  });

  function handleCopy() {
    toast.success('URL copied to clipboard');
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">File Manager</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Manage brand assets, images, and documents</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Sidebar */}
        <div className="xl:col-span-1 space-y-4">
          {/* Storage */}
          <Card>
            <CardContent className="py-4">
              <StorageBar used={storage.used} total={storage.total} />
            </CardContent>
          </Card>

          {/* Folders */}
          <Card>
            <CardHeader><CardTitle>Folders</CardTitle></CardHeader>
            <CardContent className="p-1">
              {FOLDERS.map(f => {
                const Icon = f.key === activeFolder ? FolderOpen : f.icon;
                return (
                  <button
                    key={f.key}
                    onClick={() => setActiveFolder(f.key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeFolder === f.key
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {f.label}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Main area */}
        <div className="xl:col-span-4 space-y-4">
          {/* Upload zone */}
          <UploadZone folder={activeFolder} onUploaded={() => qc.invalidateQueries({ queryKey: ['file-manager'] })} />

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search files…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-36">
              {TYPE_FILTERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
            <div className="flex border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'} transition-colors`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'} transition-colors`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Files */}
          <Card>
            <CardHeader>
              <CardTitle>
                {FOLDERS.find(f => f.key === activeFolder)?.label || 'All Files'}
                <span className="ml-2 text-sm font-normal text-gray-400 dark:text-slate-500">
                  ({filtered.length} {filtered.length === 1 ? 'file' : 'files'})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className={viewMode === 'list' ? 'p-0' : ''}>
              {isLoading && (
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-2 p-4'}>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className={viewMode === 'grid' ? 'h-40 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse' : 'h-12 bg-gray-100 dark:bg-slate-700 rounded animate-pulse'} />
                  ))}
                </div>
              )}

              {isError && (
                <div className="py-8 text-center">
                  <p className="text-sm text-red-500">Failed to load files</p>
                  <Button size="xs" variant="secondary" className="mt-2" onClick={() => qc.invalidateQueries({ queryKey: ['file-manager'] })}>Retry</Button>
                </div>
              )}

              {!isLoading && !isError && filtered.length === 0 && (
                <div className="py-12 text-center">
                  <Folder className="h-10 w-10 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 dark:text-slate-500">
                    {search ? `No files matching "${search}"` : 'No files in this folder'}
                  </p>
                </div>
              )}

              {!isLoading && !isError && filtered.length > 0 && (
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filtered.map((file, i) => (
                      <FileCard key={file.id || file.filename || i} file={file} onDelete={setDeleteTarget} onCopy={handleCopy} />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-slate-700">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">File</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Folder</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Size</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Uploaded</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                        {filtered.map((file, i) => (
                          <FileRow key={file.id || file.filename || i} file={file} onDelete={setDeleteTarget} onCopy={handleCopy} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.filename || deleteTarget?.name)}
        loading={deleteMutation.isPending}
        title="Delete File"
        message={`Permanently delete "${deleteTarget?.filename || deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
