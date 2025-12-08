import { useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loader } from '@/components/common/Loader';
import { api } from '@/services/api';
import { Filter, Plus, Edit2, Save, X } from 'lucide-react';

// BOK Colors
const BOK_COLORS = {
  primary: '#006B3C',
  secondary: '#C8102E',
  accent: '#1E3A8A',
  gold: '#D4AF37',
  lightGreen: '#10B981',
  lightRed: '#EF4444',
  lightBlue: '#3B82F6',
};

interface ComplianceRecord {
  id: number;
  [key: string]: any;
}

export function DetailsPage() {
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<ComplianceRecord>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newRecord, setNewRecord] = useState<Record<string, any>>({});
  
  // Filters
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [statusColumnName, setStatusColumnName] = useState<string>('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50); // Load 50 records at a time
  const [totalRecords, setTotalRecords] = useState(0);

  // Compliance status options
  const complianceStatusOptions = [
    'Compliant',
    'Partially Compliant',
    'Not Compliant'
  ];

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [departmentFilter, statusFilter]);

  useEffect(() => {
    fetchRecords();
  }, [currentPage, departmentFilter, statusFilter]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * pageSize;
      const response = await api.getComplianceRecords(pageSize, offset, departmentFilter || undefined, statusFilter || undefined);
      
      if (response.success && response.data) {
        setRecords(response.data);
        setTotalRecords(response.total || response.data.length);
        
        // Extract unique departments and statuses (only on first load)
        if (response.data.length > 0) {
          const firstRecord = response.data[0];
          setColumns(Object.keys(firstRecord).filter(k => k !== 'id' && k !== 'index' && k !== 'SOURCE_SHEET'));
          
          // Find department column
          const deptCol = Object.keys(firstRecord).find(
            k => k.toLowerCase().includes('department') || k.toLowerCase().includes('responsible')
          );
          if (deptCol && availableDepartments.length === 0) {
            // Fetch unique departments only once
            const deptsResponse = await api.getComplianceRecords(10000, 0);
            if (deptsResponse.success && deptsResponse.data) {
              const depts = [...new Set(deptsResponse.data.map((r: any) => r[deptCol]).filter(Boolean))] as string[];
              setAvailableDepartments(depts.sort());
            }
          }
          
          // Find status column
          const statusCol = Object.keys(firstRecord).find(
            k => k.toLowerCase().includes('status') || k.toLowerCase().includes('compliance')
          );
          if (statusCol) {
            setStatusColumnName(statusCol);
            if (availableStatuses.length === 0) {
              // Fetch unique statuses only once
              const statusResponse = await api.getComplianceRecords(10000, 0);
              if (statusResponse.success && statusResponse.data) {
                const statuses = [...new Set(statusResponse.data.map((r: any) => r[statusCol]).filter(Boolean))] as string[];
                setAvailableStatuses(statuses.sort());
              }
            }
          } else {
            setStatusColumnName('');
          }
        }
      } else {
        setRecords([]);
        setTotalRecords(0);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setRecords([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: ComplianceRecord) => {
    setEditingId(record.id);
    // Only allow editing the status column
    const statusData: Record<string, any> = {};
    if (statusColumnName) {
      statusData[statusColumnName] = record[statusColumnName] || '';
    }
    setEditData(statusData);
  };

  const handleSave = async (id: number) => {
    try {
      // Only send the status column update, not other fields
      const statusUpdate: Record<string, any> = {};
      if (statusColumnName && editData[statusColumnName] !== undefined) {
        statusUpdate[statusColumnName] = editData[statusColumnName];
      }
      
      if (Object.keys(statusUpdate).length === 0) {
        alert('Please select a compliance status');
        return;
      }
      
      const response = await api.updateComplianceRecord(id, statusUpdate);
      if (response.success) {
        await fetchRecords();
        setEditingId(null);
        setEditData({});
      } else {
        alert('Failed to update record');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save changes');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };


  const handleAdd = async () => {
    try {
      const response = await api.createComplianceRecord(newRecord);
      if (response.success) {
        await fetchRecords();
        setIsAdding(false);
        setNewRecord({});
      } else {
        alert('Failed to create record');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add record');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    const normalized = status.toLowerCase();
    if (normalized === 'compliant') {
      return 'bg-green-100 text-green-800';
    }
    if (normalized === 'partially compliant') {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (normalized === 'not compliant') {
      return 'bg-red-100 text-red-800';
    }
    // Fallback for other status values
    if (normalized.includes('compliant') && !normalized.includes('non') && !normalized.includes('partially')) {
      return 'bg-green-100 text-green-800';
    }
    if (normalized.includes('non') || normalized.includes('not')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-yellow-100 text-yellow-800';
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalRecords / pageSize);
  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);
  
  const filteredRecords = useMemo(() => {
    return records;
  }, [records]);
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <Button onClick={fetchRecords} className="mt-2">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: BOK_COLORS.primary }}>
            Compliance Register Details
          </h1>
          <p className="text-gray-600 mt-1">Manage and update compliance records</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: BOK_COLORS.primary }}
        >
          <Plus className="h-4 w-4" />
          Add New Record
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200" style={{ backgroundColor: BOK_COLORS.primary }}>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </h3>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: BOK_COLORS.primary }}>
                <Filter className="h-4 w-4 inline mr-1" />
                Department
              </label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:outline-none transition-colors bg-white font-medium"
                style={{ 
                  borderColor: BOK_COLORS.primary,
                  color: '#1f2937'
                }}
              >
                <option value="">All Departments</option>
                {availableDepartments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: BOK_COLORS.primary }}>
                <Filter className="h-4 w-4 inline mr-1" />
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:outline-none transition-colors bg-white font-medium"
                style={{ 
                  borderColor: BOK_COLORS.primary,
                  color: '#1f2937'
                }}
              >
                <option value="">All Statuses</option>
                {availableStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setDepartmentFilter('');
                  setStatusFilter('');
                }}
                className="w-full px-4 py-2 rounded-lg font-medium transition-colors text-white hover:opacity-90"
                style={{ backgroundColor: BOK_COLORS.secondary }}
              >
                Clear Filters
              </button>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm font-medium" style={{ color: BOK_COLORS.accent }}>
              Showing <span className="font-bold">{startRecord}</span> - <span className="font-bold">{endRecord}</span> of <span className="font-bold">{totalRecords}</span> records
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: currentPage === 1 ? '#e5e7eb' : BOK_COLORS.primary,
                    color: currentPage === 1 ? '#6b7280' : 'white'
                  }}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: currentPage === totalPages ? '#e5e7eb' : BOK_COLORS.primary,
                    color: currentPage === totalPages ? '#6b7280' : 'white'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add New Record Form */}
      {isAdding && (
        <div className="bg-white rounded-lg shadow-md border-2 overflow-hidden" style={{ borderColor: BOK_COLORS.primary }}>
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5" style={{ color: BOK_COLORS.primary }} />
              Add New Record
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {columns.slice(0, 8).map((col) => {
                const isStatusCol = col === statusColumnName || 
                  (col.toLowerCase().includes('status') || col.toLowerCase().includes('compliance'));
                
                return (
                  <div key={col}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                    {isStatusCol ? (
                      <select
                        value={newRecord[col] || ''}
                        onChange={(e) => setNewRecord({ ...newRecord, [col]: e.target.value })}
                        className="w-full px-3 py-2 border-2 rounded-lg text-sm font-medium bg-white focus:ring-2 focus:outline-none transition-all shadow-sm"
                        style={{ 
                          borderColor: BOK_COLORS.primary,
                          color: '#111827',
                          backgroundColor: '#ffffff'
                        }}
                      >
                        <option value="">Select Status</option>
                        {complianceStatusOptions.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={newRecord[col] || ''}
                        onChange={(e) => setNewRecord({ ...newRecord, [col]: e.target.value })}
                        className="w-full px-3 py-2 border-2 rounded-lg text-sm font-medium bg-white focus:ring-2 focus:outline-none transition-all shadow-sm"
                        style={{ 
                          borderColor: BOK_COLORS.primary,
                          color: '#111827',
                          backgroundColor: '#ffffff'
                        }}
                        placeholder={`Enter ${col}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: BOK_COLORS.primary }}
              >
                <Save className="h-4 w-4" />
                Save
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewRecord({});
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium border-2 transition-colors hover:bg-gray-50"
                style={{ borderColor: BOK_COLORS.accent, color: BOK_COLORS.accent }}
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Records Table */}
      <Card className="bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                {columns.slice(0, 6).map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    {col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="px-6 py-4 text-center text-gray-500">
                    No records found
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr 
                    key={record.id} 
                    className={editingId === record.id ? "border-2" : "hover:bg-gray-50"}
                    style={editingId === record.id ? { 
                      borderColor: BOK_COLORS.primary,
                      backgroundColor: '#eff6ff'
                    } : {}}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{record.id}</td>
                    {columns.slice(0, 6).map((col) => {
                      const isStatusCol = col === statusColumnName || 
                        (col.toLowerCase().includes('status') || col.toLowerCase().includes('compliance'));
                      const value = record[col];
                      
                      return (
                        <td key={col} className="px-4 py-3">
                          {editingId === record.id ? (
                            isStatusCol ? (
                              <select
                                value={editData[col] || ''}
                                onChange={(e) => setEditData({ ...editData, [col]: e.target.value })}
                                className="w-full px-3 py-2 border-2 rounded-lg text-sm font-medium bg-white focus:ring-2 focus:outline-none transition-all shadow-sm"
                                style={{ 
                                  borderColor: BOK_COLORS.primary,
                                  color: '#111827',
                                  backgroundColor: '#ffffff'
                                }}
                              >
                                <option value="">Select Status</option>
                                {complianceStatusOptions.map((status) => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
                            ) : (
                              // Other columns remain read-only when editing
                              <span className="text-sm text-gray-700 font-medium">
                                {value ? String(value).substring(0, 50) : '-'}
                              </span>
                            )
                          ) : isStatusCol && value ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(String(value))}`}>
                              {String(value)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-900">
                              {value ? String(value).substring(0, 50) : '-'}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3">
                      {editingId === record.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave(record.id)}
                            className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white flex items-center gap-1 transition-colors hover:opacity-90 shadow-sm"
                            style={{ backgroundColor: BOK_COLORS.primary }}
                          >
                            <Save className="h-4 w-4" />
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            className="px-3 py-1.5 rounded-lg text-sm font-semibold border-2 flex items-center gap-1 transition-colors hover:bg-gray-50 shadow-sm"
                            style={{ borderColor: BOK_COLORS.secondary, color: BOK_COLORS.secondary }}
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(record)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                            style={{ color: BOK_COLORS.accent }}
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
