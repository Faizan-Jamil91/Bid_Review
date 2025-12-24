'use client';

import React, { useState, useRef } from 'react';
import { 
  DocumentTextIcon, 
  ArrowUpTrayIcon, 
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { api } from '@/lib/api/client';
import { toast } from 'react-hot-toast';

interface BidDocument {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
  upload_date: string;
  uploaded_by: string;
  file_url?: string;
  description?: string;
}

interface BidDocumentsProps {
  bidId: string;
}

const BidDocuments: React.FC<BidDocumentsProps> = ({ bidId }) => {
  const [documents, setDocuments] = useState<BidDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingDocument, setEditingDocument] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching documents for bid:', bidId);
      const response = await api.getBidDocuments(bidId);
      console.log('Documents response:', response);
      setDocuments(response.data || response || []);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDocuments();
  }, [bidId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      await api.uploadBidDocuments(bidId, formData);
      
      toast.success('Documents uploaded successfully');
      fetchDocuments();
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading documents:', error);
      toast.error(error.response?.data?.message || 'Failed to upload documents');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await api.deleteBidDocument(bidId, documentId);
      toast.success('Document deleted successfully');
      fetchDocuments();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleUpdateDocumentDescription = async (documentId: string) => {
    try {
      await api.updateBidDocument(bidId, documentId, { description: editDescription });
      toast.success('Document description updated');
      setEditingDocument(null);
      setEditDescription('');
      fetchDocuments();
    } catch (error: any) {
      console.error('Error updating document:', error);
      toast.error('Failed to update document');
    }
  };

  const handleEditDocument = (document: BidDocument) => {
    setEditingDocument(document.id);
    setEditDescription(document.description || '');
  };

  const handleCancelEdit = () => {
    setEditingDocument(null);
    setEditDescription('');
  };

  const handleDownloadDocument = async (document: BidDocument) => {
    try {
      const response = await api.downloadBidDocument(bidId, document.id);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.name);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    return <DocumentTextIcon className="h-5 w-5 text-gray-400" />;
  };

  const getFileTypeColor = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return 'bg-red-100 text-red-800';
    if (type.includes('doc') || type.includes('word')) return 'bg-blue-100 text-blue-800';
    if (type.includes('xls') || type.includes('excel')) return 'bg-green-100 text-green-800';
    if (type.includes('ppt') || type.includes('powerpoint')) return 'bg-orange-100 text-orange-800';
    if (type.includes('zip') || type.includes('rar')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Bid Documents</h3>
          <div className="flex space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowUpTrayIcon className="-ml-1 mr-2 h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="px-4 py-5 sm:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
            <p className="mt-1 text-sm text-gray-500">
              Upload documents related to this bid.
            </p>
            <div className="mt-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <DocumentTextIcon className="-ml-1 mr-2 h-5 w-5" />
                Upload Document
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((document: BidDocument) => (
              <div
                key={document.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getFileIcon(document.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {document.name}
                    </p>
                    {editingDocument === document.id ? (
                      <div className="mt-2 space-y-2">
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Add description..."
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateDocumentDescription(document.id)}
                            className="px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {document.description && (
                          <p className="text-xs text-gray-600 mt-1 truncate">{document.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getFileTypeColor(document.file_type)}`}>
                            {document.file_type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatFileSize(document.file_size)}
                          </span>
                          <span className="text-xs text-gray-500">
                            Uploaded {new Date(document.upload_date).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-gray-500">
                            by {document.uploaded_by}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownloadDocument(document)}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md border border-gray-300"
                    title="Download"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEditDocument(document)}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md border border-blue-300"
                    title="Edit Description"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDocument(document.id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md border border-red-300"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BidDocuments;
