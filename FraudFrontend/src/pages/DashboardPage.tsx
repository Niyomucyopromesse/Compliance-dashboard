import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loader } from '@/components/common/Loader';
import { api } from '@/services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// BOK Colors (Bank of Kenya)
const BOK_COLORS = {
  primary: '#006B3C',      // Dark Green
  secondary: '#C8102E',    // Red
  accent: '#1E3A8A',       // Dark Blue
  gold: '#D4AF37',         // Gold
  lightGreen: '#10B981',   // Light Green
  lightRed: '#EF4444',     // Light Red
  lightBlue: '#3B82F6',    // Light Blue
  gray: '#6B7280'          // Gray
};

export function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsResponse, recordsResponse] = await Promise.all([
        api.getComplianceStats(),
        api.getComplianceRecords(1000, 0)
      ]);
      
      // Handle response structure - check if response has success and data properties
      if (statsResponse && statsResponse.success) {
        setStats(statsResponse.data);
      } else if (statsResponse && statsResponse.data) {
        // If response is just the data object
        setStats(statsResponse.data);
      } else {
        setStats(statsResponse);
      }
      
      if (recordsResponse && recordsResponse.success) {
        const data = recordsResponse.data || [];
        setRecords(data);
        console.log('Dashboard: Records loaded:', data.length, 'First record:', data[0]);
      } else if (recordsResponse && recordsResponse.data) {
        const data = recordsResponse.data || [];
        setRecords(data);
        console.log('Dashboard: Records loaded (alt format):', data.length, 'First record:', data[0]);
      } else if (Array.isArray(recordsResponse)) {
        setRecords(recordsResponse);
        console.log('Dashboard: Records loaded (direct array):', recordsResponse.length, 'First record:', recordsResponse[0]);
      } else {
        setRecords([]);
        console.log('Dashboard: No records found in response:', recordsResponse);
      }
    } catch (err: any) {
      const errorMessage = err?.message || err?.detail || 'Failed to load compliance data. Make sure the Excel file exists in the data folder.';
      setError(errorMessage);
      console.error('Error loading compliance data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Process data for visualizations
  const getStatusDistribution = () => {
    if (!records || !Array.isArray(records) || records.length === 0) {
      console.log('Dashboard: No records available for status distribution');
      return [];
    }
    
    console.log('Dashboard: Processing status distribution, records count:', records.length);
    console.log('Dashboard: First record keys:', records[0] ? Object.keys(records[0]) : 'No first record');
    
    // Find status column - try multiple variations
    const statusCol = records[0] ? Object.keys(records[0]).find(
      key => {
        const lowerKey = key.toLowerCase();
        return lowerKey.includes('status') || 
               lowerKey.includes('compliance') ||
               lowerKey.includes('state') ||
               lowerKey.includes('condition');
      }
    ) : null;
    
    console.log('Dashboard: Found status column:', statusCol);
    
    if (!statusCol) {
      console.log('Dashboard: No status column found. Available columns:', records[0] ? Object.keys(records[0]) : []);
      return [];
    }
    
    const statusCounts: Record<string, number> = {};
    records.forEach((record: any) => {
      if (record && record[statusCol] !== undefined && record[statusCol] !== null) {
        const status = String(record[statusCol]).trim() || 'Unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      }
    });
    
    const result = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    console.log('Dashboard: Status distribution result:', result);
    return result;
  };

  const getDepartmentDistribution = () => {
    if (!records || !Array.isArray(records) || records.length === 0) {
      console.log('Dashboard: No records available for department distribution');
      return [];
    }
    
    console.log('Dashboard: Processing department distribution, records count:', records.length);
    
    // Find department column - try multiple variations
    const deptCol = records[0] ? Object.keys(records[0]).find(
      key => {
        const lowerKey = key.toLowerCase();
        return lowerKey.includes('department') || 
               lowerKey.includes('responsible') ||
               lowerKey.includes('dept') ||
               lowerKey.includes('division') ||
               lowerKey.includes('unit');
      }
    ) : null;
    
    console.log('Dashboard: Found department column:', deptCol);
    
    if (!deptCol) {
      console.log('Dashboard: No department column found. Available columns:', records[0] ? Object.keys(records[0]) : []);
      return [];
    }
    
    const deptCounts: Record<string, number> = {};
    records.forEach((record: any) => {
      if (record && record[deptCol] !== undefined && record[deptCol] !== null) {
        const dept = String(record[deptCol]).trim() || 'Unknown';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      }
    });
    
    const result = Object.entries(deptCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    
    console.log('Dashboard: Department distribution result:', result);
    return result;
  };

  const getComplianceMetrics = () => {
    if (!records || !Array.isArray(records) || records.length === 0) {
      return {
        total: 0,
        compliant: 0,
        nonCompliant: 0,
        pending: 0,
        complianceRate: 0
      };
    }

    const statusCol = records[0] ? Object.keys(records[0]).find(
      key => key.toLowerCase().includes('status') || key.toLowerCase().includes('compliance')
    ) : null;

    if (!statusCol) {
      return {
        total: records.length,
        compliant: 0,
        nonCompliant: 0,
        pending: 0,
        complianceRate: 0
      };
    }

    let compliant = 0;
    let nonCompliant = 0;
    let pending = 0;

    records.forEach((record: any) => {
      if (record && record[statusCol] !== undefined && record[statusCol] !== null) {
        const status = String(record[statusCol] || '').toLowerCase();
        if (status.includes('compliant') && !status.includes('non')) {
          compliant++;
        } else if (status.includes('non')) {
          nonCompliant++;
        } else {
          pending++;
        }
      }
    });

    const total = records.length;
    const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 0;

    return { total, compliant, nonCompliant, pending, complianceRate };
  };

  const getRecentRecords = () => {
    // Get last 10 records
    if (!records || !Array.isArray(records) || records.length === 0) return [];
    return records.slice(-10).reverse();
  };

  const statusData = getStatusDistribution();
  const departmentData = getDepartmentDistribution();
  const metrics = getComplianceMetrics();
  const recentRecords = getRecentRecords();

  const statusColors = [BOK_COLORS.primary, BOK_COLORS.secondary, BOK_COLORS.gold, BOK_COLORS.lightBlue, BOK_COLORS.gray];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader size="lg" text="Loading compliance dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-red-600 text-lg font-semibold">⚠️ {error}</div>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: BOK_COLORS.primary }}>
            📊 Compliance Register Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Comprehensive view of compliance status and metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/details">
            <button 
              className="px-3 py-1.5 text-sm font-medium rounded-lg text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: BOK_COLORS.primary }}
            >
              Manage Records
            </button>
          </Link>
          <Button onClick={fetchData} size="sm" variant="outline">
            🔄 Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="text-white rounded-lg shadow-md p-6" style={{ background: `linear-gradient(135deg, ${BOK_COLORS.primary} 0%, ${BOK_COLORS.lightGreen} 100%)` }}>
          <div className="flex flex-col">
            <div className="text-sm opacity-90">Total Records</div>
            <div className="text-3xl font-bold mt-2">{metrics.total}</div>
            <div className="text-xs opacity-75 mt-1">In Register</div>
          </div>
        </div>
        
        <div className="text-white rounded-lg shadow-md p-6" style={{ background: `linear-gradient(135deg, ${BOK_COLORS.lightGreen} 0%, #34D399 100%)` }}>
          <div className="flex flex-col">
            <div className="text-sm opacity-90">Compliant</div>
            <div className="text-3xl font-bold mt-2">{metrics.compliant}</div>
            <div className="text-xs opacity-75 mt-1">{metrics.total > 0 ? Math.round((metrics.compliant / metrics.total) * 100) : 0}% of total</div>
          </div>
        </div>
        
        <div className="text-white rounded-lg shadow-md p-6" style={{ background: `linear-gradient(135deg, ${BOK_COLORS.secondary} 0%, ${BOK_COLORS.lightRed} 100%)` }}>
          <div className="flex flex-col">
            <div className="text-sm opacity-90">Non-Compliant</div>
            <div className="text-3xl font-bold mt-2">{metrics.nonCompliant}</div>
            <div className="text-xs opacity-75 mt-1">Requires attention</div>
          </div>
        </div>
        
        <div className="text-white rounded-lg shadow-md p-6" style={{ background: `linear-gradient(135deg, ${BOK_COLORS.gold} 0%, #FCD34D 100%)` }}>
          <div className="flex flex-col">
            <div className="text-sm opacity-90">Pending</div>
            <div className="text-3xl font-bold mt-2">{metrics.pending}</div>
            <div className="text-xs opacity-75 mt-1">In review</div>
          </div>
        </div>
        
        <div className="text-white rounded-lg shadow-md p-6" style={{ background: `linear-gradient(135deg, ${BOK_COLORS.accent} 0%, ${BOK_COLORS.lightBlue} 100%)` }}>
          <div className="flex flex-col">
            <div className="text-sm opacity-90">Compliance Rate</div>
            <div className="text-3xl font-bold mt-2">{metrics.complianceRate}%</div>
            <div className="text-xs opacity-75 mt-1">Overall status</div>
          </div>
        </div>
      </div>

      {/* Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Compliance Status Distribution</h3>
          </div>
          <div className="px-6 py-4" style={{ height: '350px' }}>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={statusColors[index % statusColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-gray-500 mb-2">No status data available</div>
                {records && records.length > 0 && records[0] && (
                  <div className="text-xs text-gray-400 mt-2 text-center max-w-md">
                    Available columns: {Object.keys(records[0]).slice(0, 10).join(', ')}
                    {Object.keys(records[0]).length > 10 && '...'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Department Distribution Bar Chart */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Departments by Compliance Items</h3>
          </div>
          <div className="px-6 py-4" style={{ height: '350px' }}>
            {departmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill={BOK_COLORS.primary} name="Compliance Items" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-gray-500 mb-2">No department data available</div>
                {records && records.length > 0 && records[0] && (
                  <div className="text-xs text-gray-400 mt-2 text-center max-w-md">
                    Available columns: {Object.keys(records[0]).slice(0, 10).join(', ')}
                    {Object.keys(records[0]).length > 10 && '...'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compliance Rate Progress */}
      <Card title="Overall Compliance Rate">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-700">Bank-wide Compliance</span>
            <span className={`text-2xl font-bold ${
              metrics.complianceRate >= 80 ? 'text-green-600' :
              metrics.complianceRate >= 60 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {metrics.complianceRate}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-6">
            <div
              className={`h-6 rounded-full transition-all duration-500 ${
                metrics.complianceRate >= 80 ? 'bg-green-500' :
                metrics.complianceRate >= 60 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${metrics.complianceRate}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Compliant: </span>
              <span className="font-semibold text-green-600">{metrics.compliant}</span>
            </div>
            <div>
              <span className="text-gray-600">Non-Compliant: </span>
              <span className="font-semibold text-red-600">{metrics.nonCompliant}</span>
            </div>
            <div>
              <span className="text-gray-600">Pending: </span>
              <span className="font-semibold text-yellow-600">{metrics.pending}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Data Quality Summary */}
      {stats?.summary?.data_quality && (
        <Card title="Data Quality Metrics">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="border-l-4 pl-4" style={{ borderColor: BOK_COLORS.lightGreen }}>
              <div className="text-sm text-gray-600">Complete Records</div>
              <div className="text-2xl font-bold" style={{ color: BOK_COLORS.primary }}>
                {stats.summary.data_quality.complete_records}
              </div>
            </div>
            <div className="border-l-4 pl-4" style={{ borderColor: BOK_COLORS.gold }}>
              <div className="text-sm text-gray-600">Incomplete Records</div>
              <div className="text-2xl font-bold" style={{ color: BOK_COLORS.gold }}>
                {stats.summary.data_quality.incomplete_records}
              </div>
            </div>
            <div className="border-l-4 pl-4" style={{ borderColor: BOK_COLORS.accent }}>
              <div className="text-sm text-gray-600">Completion Rate</div>
              <div className="text-2xl font-bold" style={{ color: BOK_COLORS.accent }}>
                {stats.summary.data_quality.completion_rate}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Compliance Records */}
      {records && records.length > 0 && records[0] && (
        <Card title="Recent Compliance Records">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  {Object.keys(records[0]).slice(0, 4).filter(k => k !== 'id' && k !== 'index').map((col) => (
                    <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No records found
                    </td>
                  </tr>
                ) : (
                  recentRecords.map((record: any) => {
                    if (!record) return null;
                    const statusCol = Object.keys(record).find(
                      k => k.toLowerCase().includes('status') || k.toLowerCase().includes('compliance')
                    );
                    const getStatusColor = (status: string) => {
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

                    return (
                      <tr key={record.id || Math.random()} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{record.id || '-'}</td>
                        {Object.keys(record).slice(0, 4).filter(k => k !== 'id' && k !== 'index').map((col) => (
                          <td key={col} className="px-6 py-4 text-sm text-gray-900">
                            {col === statusCol && record[col] ? (
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(String(record[col]))}`}>
                                {String(record[col])}
                              </span>
                            ) : (
                              record[col] ? String(record[col]).substring(0, 50) : '-'
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <Link to="/details">
              <Button variant="outline" size="sm">View All Records →</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
