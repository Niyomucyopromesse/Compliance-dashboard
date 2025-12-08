import { useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loader } from '@/components/common/Loader';
import { api } from '@/services/api';
import { Filter, Plus, Edit2, Save, X, Trash2 } from 'lucide-react';

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

  useEffect(() => {
    fetchRecords();
  }, [departmentFilter, statusFilter]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await api.getComplianceRecords(1000, 0, departmentFilter || undefined, statusFilter || undefined);
      
      if (response.success && response.data) {
        setRecords(response.data);
        
        // Extract unique departments and statuses
        if (response.data.length > 0) {
          const firstRecord = response.data[0];
          setColumns(Object.keys(firstRecord).filter(k => k !== 'id' && k !== 'index'));
          
          // Find department column
          const deptCol = Object.keys(firstRecord).find(
            k => k.toLowerCase().includes('department') || k.toLowerCase().includes('responsible')
          );
          if (deptCol) {
            const depts = [...new Set(response.data.map((r: any) => r[deptCol]).filter(Boolean))];
            setAvailableDepartments(depts.sort());
          }
          
          // Find status column
          const statusCol = Object.keys(firstRecord).find(
            k => k.toLowerCase().includes('status') || k.toLowerCase().includes('compliance')
          );
          if (statusCol) {
            const statuses = [...new Set(response.data.map((r: any) => r[statusCol]).filter(Boolean))];
            setAvailableStatuses(statuses.sort());
          }
        }
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: ComplianceRecord) => {
    setEditingId(record.id);
    setEditData({ ...record });
  };

  const handleSave = async (id: number) => {
    try {
      const response = await api.updateComplianceRecord(id, editData);
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

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      // Note: Backend doesn't have delete endpoint yet, but we can add it
      alert('Delete functionality requires backend endpoint. Please contact administrator.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete record');
    }
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
    if (normalized.includes('compliant') && !normalized.includes('non')) {
      return 'bg-green-100 text-green-800';
    }
    if (normalized.includes('non')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-yellow-100 text-yellow-800';
  };

  const filteredRecords = useMemo(() => {
    return records;
  }, [records]);

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
        <Button
          onClick={() => setIsAdding(true)}
          style={{ backgroundColor: BOK_COLORS.primary, color: 'white' }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Record
        </Button>
      </div>

      {/* Filters */}
      <Card title="Filters" className="bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="h-4 w-4 inline mr-1" />
              Department
            </label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {availableDepartments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="h-4 w-4 inline mr-1" />
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {availableStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => {
                setDepartmentFilter('');
                setStatusFilter('');
              }}
              variant="outline"
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Showing {filteredRecords.length} of {records.length} records
        </div>
      </Card>

      {/* Add New Record Form */}
      {isAdding && (
        <Card className="border-2" style={{ borderColor: BOK_COLORS.primary }}>
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5" style={{ color: BOK_COLORS.primary }} />
              Add New Record
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {columns.slice(0, 8).map((col) => (
                <div key={col}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </label>
                  <input
                    type="text"
                    value={newRecord[col] || ''}
                    onChange={(e) => setNewRecord({ ...newRecord, [col]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={`Enter ${col}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleAdd}
                style={{ backgroundColor: BOK_COLORS.primary, color: 'white' }}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
              <Button
                onClick={() => {
                  setIsAdding(false);
                  setNewRecord({});
                }}
                variant="outline"
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </Card>
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
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{record.id}</td>
                    {columns.slice(0, 6).map((col) => {
                      const isStatusCol = col.toLowerCase().includes('status') || col.toLowerCase().includes('compliance');
                      const value = record[col];
                      
                      return (
                        <td key={col} className="px-4 py-3">
                          {editingId === record.id ? (
                            <input
                              type="text"
                              value={editData[col] || ''}
                              onChange={(e) => setEditData({ ...editData, [col]: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
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
                            className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center gap-1"
                            style={{ color: BOK_COLORS.primary }}
                          >
                            <Save className="h-4 w-4" />
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center gap-1"
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
