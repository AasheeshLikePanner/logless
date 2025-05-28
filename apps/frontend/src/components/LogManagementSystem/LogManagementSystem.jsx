import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, BarChart3, Table, ChevronLeft, ChevronRight } from "lucide-react";
import CalendarDateRangePicker from "./CalendarDateRangePicker";
import LogTable from "./LogTable";
import SearchFilters from "./SearchFilters";
import LogsPerTimeChart from "./Charts/LogsPerTimeChart";
import LogsByLevelChart from "./Charts/LogsByLevelChart";
import LogsByUserChart from "./Charts/LogsByUserChart";
import { getAllLogs, getCustomColors, getSearchLogs } from "@/apis/api";
import { Button } from "@/components/ui/button";

export default function LogManagementSystem() {
  const [logsData, setLogsData] = useState({
    data: [],
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1
  });
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [activeTab, setActiveTab] = useState("table");
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState();
  const [fetchedCustomColors, setFetchedCustomColors] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  // Decode base64 logs and parse JSON
  const decodeLogs = (encodedLogs) => {
    return encodedLogs.map(log => {
      try {
        const decoded = atob(log);
        return JSON.parse(decoded);
      } catch (error) {
        console.error("Error decoding log:", error);
        return null;
      }
    }).filter(log => log !== null);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await getAllLogs(logsData.page, logsData.pageSize);
        console.log("Response from API:", response);
        
        setLogsData({
          data: response.data,
          page: response.page,
          pageSize: response.pageSize,
          totalCount: response.totalCount,
          totalPages: response.totalPages
        });
        
        setFilteredLogs(decodeLogs(response.data));
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchCustomColors = async () => {
      try {
        const response = await getCustomColors();
        setFetchedCustomColors(response);
      } catch (error) {
        console.error("Failed to fetch custom colors:", error);
      }
    };

    fetchCustomColors();
    fetchData();
  }, [logsData.page, logsData.pageSize]);

  const handleSearch = async (term) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      // If search term is empty, reset to showing all logs
      const response = await getAllLogs(1, logsData.pageSize);
      setLogsData({
        data: response.data,
        page: 1,
        pageSize: logsData.pageSize,
        totalCount: response.totalCount,
        totalPages: response.totalPages
      });
      setFilteredLogs(decodeLogs(response.data));
      return;
    }
    
    try {
      setIsLoading(true);
      const processedTerm = term.replaceAll(" ", " | ");
      const response = await getSearchLogs(processedTerm.toLowerCase());
      setFilteredLogs(decodeLogs(response));
      
      // Reset pagination data for search results
      setLogsData(prev => ({
        ...prev,
        page: 1,
        totalCount: response.length,
        totalPages: Math.ceil(response.length / prev.pageSize)
      }));
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = (filters) => {
    let filtered = decodeLogs(logsData.data);
    
    if (filters.logLevel) {
      filtered = filtered.filter(log => log.Level === filters.logLevel);
    }
    
    if (filters.userId) {
      filtered = filtered.filter(log => log.Context?.userId === filters.userId);
    }
    
    if (filters.endpoint) {
      filtered = filtered.filter(log => log.Context?.endpoint === filters.endpoint);
    }
    
    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.TimeStamp);
        return logDate >= dateRange.from && logDate <= dateRange.to;
      });
    }
    
    setFilteredLogs(filtered);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= logsData.totalPages) {
      setLogsData(prev => ({ ...prev, page: newPage }));
    }
  };

  const handlePageSizeChange = (newSize) => {
    setLogsData(prev => ({ ...prev, pageSize: newSize, page: 1 }));
  };

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Log Management System</h1>
        <p className="text-gray-600">Monitor and analyze your application logs in real-time</p>
      </div>
      
      <SearchFilters 
        onSearch={handleSearch} 
        onFilter={handleFilter}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="table" className="flex items-center gap-2">
            <Table size={16} />
            <span>Log Table</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 size={16} />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="table" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              {isLoading ? (
                <div className="h-60 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
                  <LogTable logs={filteredLogs} onLogSelect={setSelectedLog} />
                  
                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                      Showing {filteredLogs.length} of {logsData.totalCount} logs
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(logsData.page - 1)}
                        disabled={logsData.page === 1}
                      >
                        <ChevronLeft size={16} />
                      </Button>
                      
                      <span className="text-sm">
                        Page {logsData.page} of {logsData.totalPages}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(logsData.page + 1)}
                        disabled={logsData.page >= logsData.totalPages}
                      >
                        <ChevronRight size={16} />
                      </Button>
                      
                      <select
                        value={logsData.pageSize}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        className="border rounded-md px-2 py-1 text-sm"
                      >
                        {[10, 20, 50, 100].map(size => (
                          <option key={size} value={size}>
                            {size} per page
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div>
              {selectedLog ? (
                <div className="p-4 bg-gray-50 rounded-md border">
                  <h3 className="font-medium mb-2">Log Details</h3>
                  <pre className="bg-black text-green-400 p-4 rounded-md overflow-auto text-xs">
                    {JSON.stringify(selectedLog, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-8 bg-gray-50 border rounded-md">
                  <div className="text-center text-gray-500">
                    <Eye size={24} className="mx-auto mb-2" />
                    <p>Select a log to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LogsPerTimeChart logs={filteredLogs} />
            <LogsByLevelChart logs={filteredLogs} customColors={fetchedCustomColors} />
          </div>
          <LogsByUserChart customColors={fetchedCustomColors || {}} logs={filteredLogs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}