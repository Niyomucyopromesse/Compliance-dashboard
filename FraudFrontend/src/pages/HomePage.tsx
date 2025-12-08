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

export function HomePage() {
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
      
      const [statsData, recordsData] = await Promise.all([
        api.getComplianceStats(),
        api.getComplianceRecords(1000, 0)
      ]);
      
      setStats(statsData.data);
      setRecords(recordsData.data || []);
    } catch (err) {
      setError('Failed to load compliance data. Make sure the Excel file exists in the data folder.');
      console.error('Error loading compliance data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Process data for visualizations
  const getStatusDistribution = () => {
    if (!records.length) return [];
    
    // Find status column
    const statusCol = records[0] ? Object.keys(records[0]).find(
      key => key.toLowerCase().includes('status') || key.toLowerCase().includes('compliance')
    ) : null;
    
    if (!statusCol) return [];
    
    const statusCounts: Record<string, number> = {};
    records.forEach((record: any) => {
      const status = record[statusCol] || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  };

  const getDepartmentDistribution = () => {
    if (!records.length) return [];
    
    // Find department column
    const deptCol = records[0] ? Object.keys(records[0]).find(
      key => key.toLowerCase().includes('department') || key.toLowerCase().includes('responsible')
    ) : null;
    
    if (!deptCol) return [];
    
    const deptCounts: Record<string, number> = {};
    records.forEach((record: any) => {
      const dept = record[deptCol] || 'Unknown';
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });
    
    // Sort by count and take top 10
    return Object.entries(deptCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  const statusData = getStatusDistribution();
  const departmentData = getDepartmentDistribution();

  const statusColors = [BOK_COLORS.primary, BOK_COLORS.secondary, BOK_COLORS.gold, BOK_COLORS.lightBlue, BOK_COLORS.gray];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader size="lg" text="Loading compliance data..." />
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
            🛡️ Compliance Register Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Overview of compliance status and statistics
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/compliance">
            <Button variant="outline" size="sm">View Full Compliance</Button>
          </Link>
          <Link to="/details">
            <Button size="sm" style={{ backgroundColor: BOK_COLORS.primary, color: 'white' }}>
              Manage Records
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-white" style={{ background: `linear-gradient(135deg, ${BOK_COLORS.primary} 0%, ${BOK_COLORS.lightGreen} 100%)` }}>
          <div className="flex flex-col">
            <div className="text-sm opacity-90">Total Records</div>
            <div className="text-3xl font-bold mt-2">{stats?.total_records || 0}</div>
            <div className="text-xs opacity-75 mt-1">In Compliance Register</div>
          </div>
        </Card>
        
        <Card className="text-white" style={{ background: `linear-gradient(135deg, ${BOK_COLORS.lightGreen} 0%, #34D399 100%)` }}>
          <div className="flex flex-col">
            <div className="text-sm opacity-90">Complete Records</div>
            <div className="text-3xl font-bold mt-2">{stats?.summary?.data_quality?.complete_records || 0}</div>
            <div className="text-xs opacity-75 mt-1">
              {stats?.summary?.data_quality?.completion_rate || '0%'} completion
            </div>
          </div>
        </Card>
        
        <Card className="text-white" style={{ background: `linear-gradient(135deg, ${BOK_COLORS.accent} 0%, ${BOK_COLORS.lightBlue} 100%)` }}>
          <div className="flex flex-col">
            <div className="text-sm opacity-90">Data Fields</div>
            <div className="text-3xl font-bold mt-2">{stats?.columns?.length || 0}</div>
            <div className="text-xs opacity-75 mt-1">Available columns</div>
          </div>
        </Card>
        
        <Card className="text-white" style={{ background: `linear-gradient(135deg, ${BOK_COLORS.secondary} 0%, ${BOK_COLORS.lightRed} 100%)` }}>
          <div className="flex flex-col">
            <div className="text-sm opacity-90">Incomplete</div>
            <div className="text-3xl font-bold mt-2">{stats?.summary?.data_quality?.incomplete_records || 0}</div>
            <div className="text-xs opacity-75 mt-1">Requires attention</div>
          </div>
        </Card>
      </div>

      {/* Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <Card title="Compliance Status Distribution" className="h-96">
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
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={statusColors[index % statusColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No status data available
            </div>
          )}
        </Card>

        {/* Department Distribution Bar Chart */}
        <Card title="Top Departments by Compliance Items" className="h-96">
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
            <div className="flex items-center justify-center h-full text-gray-500">
              No department data available
            </div>
          )}
        </Card>
      </div>

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

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="flex flex-wrap gap-3">
          <Link to="/compliance">
            <Button style={{ backgroundColor: BOK_COLORS.primary, color: 'white' }}>
              View Full Compliance Register
            </Button>
          </Link>
          <Link to="/details">
            <Button variant="outline" style={{ borderColor: BOK_COLORS.accent, color: BOK_COLORS.accent }}>
              Manage & Edit Records
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline">View Dashboard</Button>
          </Link>
          <Link to="/overview">
            <Button variant="outline">View Overview</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
