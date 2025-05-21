import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, BarChart3, Table } from "lucide-react";
import CalendarDateRangePicker from "./CalendarDateRangePicker";
import LogTable from "./LogTable";
import SearchFilters from "./SearchFilters";
import LogsPerTimeChart from "./Charts/LogsPerTimeChart";
import LogsByLevelChart from "./Charts/LogsByLevelChart";
import LogsByUserChart from "./Charts/LogsByUserChart";
import { getAllLogs, getSearchLogs } from "@/apis/api";

export default function LogManagementSystem() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [activeTab, setActiveTab] = useState("table");
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // const mockData = Array(50).fill(null).map((_, i) => ({
        //   TimeStamp: new Date(Date.now() - i * 1000 * 60 * 30).toISOString(),
        //   Message: i % 5 === 0 
        //     ? `Error processing request: timeout` 
        //     : i % 3 === 0 
        //       ? `Warning: High memory usage detected` 
        //       : `User action completed successfully`,
        //   LogLevel: i % 5 === 0 ? "ERROR" : i % 3 === 0 ? "WARN" : "INFO",
        //   Context: {
        //     userId: i % 3 === 0 ? "abc123" : "def456",
        //     endpoint: i % 4 === 0 ? "/api/users" : "/api/dashboard",
        //     env: i % 7 === 0 ? "dev" : "prod"
        //   }
        // }));
        const response = await getAllLogs();
        console.log("Response from API:", response);
        setLogs(response);
        setFilteredLogs(response);
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleSearch = async (term) => {
    if (!term.trim()) {
      setFilteredLogs(logs);
      return;
    }
    
    const filtered = logs.filter(log => 
      log.Message.toLowerCase().includes(term.toLowerCase()) ||
      (log.Context?.userId && log.Context.userId.toLowerCase().includes(term.toLowerCase()))
    );

    term = term.replaceAll(" ", " | ")
    const response  = await getSearchLogs(term.toLowerCase());
    console.log("Response from API:", response);
    const data = response.map(log => ({
      ...JSON.parse(atob(log))
    }))
    console.log("Fetched logs:", data);
    setFilteredLogs(data)
  };

  const handleFilter = async (filters) => {
    let filtered = [...logs];
    
    if (filters.logLevel) {
      filtered = filtered.filter(log => log.LogLevel === filters.logLevel);
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
                <LogTable logs={filteredLogs} onLogSelect={setSelectedLog} />
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
            <LogsByLevelChart logs={filteredLogs} />
          </div>
          <LogsByUserChart logs={filteredLogs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}