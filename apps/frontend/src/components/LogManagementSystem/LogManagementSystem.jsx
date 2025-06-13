import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Eye, BarChart3, Table, ChevronLeft, ChevronRight } from "lucide-react";
import CalendarDateRangePicker from "./CalendarDateRangePicker";
import LogTable from "./LogTable";
import SearchFilters from "./SearchFilters";
import LogsPerTimeChart from "./Charts/LogsPerTimeChart";
import LogsByLevelChart from "./Charts/LogsByLevelChart";
import LogsByUserChart from "./Charts/LogsByUserChart";
import { getAllLogs, getCustomColors, getLogByLevel, getLogsByDateRange, getSearchLogs } from "@/apis/api";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [serviceHealth, setServiceHealth] = useState({ status: "healthy", message: "" });

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

  // Analyze service health based on logs
  const analyzeServiceHealth = (logs) => {
    const levelCounts = logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {});

    const errorCount = levelCounts['error'] || 0;
    const warningCount = levelCounts['warn'] || 0;
    const successCount = levelCounts['info'] || 0;

    if (errorCount > successCount) {
      return {
        status: "critical",
        message: `Service is unstable. Errors (${errorCount}) exceed successes (${successCount}). Immediate action required.`
      };
    } else if (errorCount + warningCount >= successCount * 0.5) {
      return {
        status: "warning",
        message: `Service may be degrading. Warnings/Errors (${errorCount + warningCount}) are approaching success count (${successCount}).`
      };
    }

    return {
      status: "healthy",
      message: `Service is operating normally. Successes: ${successCount}, Errors: ${errorCount}, Warnings: ${warningCount}`
    };
  };

// Add this useEffect to trigger filtering when dateRange changes
useEffect(() => {
  if (dateRange?.from && dateRange?.to) {
    handleFilter({});
  }
}, [dateRange]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await getAllLogs(logsData.page, logsData.pageSize);
        const decodedLogs = decodeLogs(response.data);

        setLogsData({
          data: response.data,
          page: response.page,
          pageSize: response.pageSize,
          totalCount: response.totalCount,
          totalPages: response.totalPages
        });

        setFilteredLogs(decodedLogs);
        setServiceHealth(analyzeServiceHealth(decodedLogs));
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
      const response = await getAllLogs(1, logsData.pageSize);
      const decodedLogs = decodeLogs(response.data);

      setLogsData({
        data: response.data,
        page: 1,
        pageSize: logsData.pageSize,
        totalCount: response.totalCount,
        totalPages: response.totalPages
      });
      setFilteredLogs(decodedLogs);
      setServiceHealth(analyzeServiceHealth(decodedLogs));
      return;
    }

    try {
      setIsLoading(true);
      const processedTerm = term.replaceAll(" ", " | ");
      const response = await getSearchLogs(processedTerm.toLowerCase());
      const decodedLogs = decodeLogs(response);

      setFilteredLogs(decodedLogs);
      setServiceHealth(analyzeServiceHealth(decodedLogs));

      setLogsData(prev => ({
        ...prev,
        page: 1,
        totalCount: decodedLogs.length,
        totalPages: Math.ceil(decodedLogs.length / prev.pageSize)
      }));
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = async (filters) => {
    try {
      setIsLoading(true);

      let response;

      if (filters.logLevel) {
        response = await getLogByLevel(filters.logLevel.toLowerCase());
      } else {
        // Add a new API function that accepts date range
        console.log(dateRange);
        
        response = await getLogsByDateRange(
          dateRange?.from?.toISOString(),
          dateRange?.to?.toISOString(),
          logsData.page,
          logsData.pageSize
        );
      }
      console.log(response);
      
      const decodedLogs = decodeLogs(response.data || response);

      setFilteredLogs(decodedLogs);
      setServiceHealth(analyzeServiceHealth(decodedLogs));

      setLogsData(prev => ({
        ...prev,
        page: response.page || 1,
        totalCount: response.totalCount || decodedLogs.length,
        totalPages: response.totalPages || Math.ceil(decodedLogs.length / prev.pageSize)
      }));
    } catch (error) {
      console.error("Filtering failed:", error);
    } finally {
      setIsLoading(false);
    }
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
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-gray-800">Log Dashboard</h1>

        {serviceHealth.status !== "healthy" && (
          <Alert variant={serviceHealth.status === "critical" ? "destructive" : "warning"}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="capitalize">{serviceHealth.status} Status</AlertTitle>
            <AlertDescription>
              {serviceHealth.message}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="bg-white rounded-lg border p-4 space-y-4">
        <SearchFilters
          onSearch={handleSearch}
          onFilter={handleFilter}
          dateRange={dateRange}
          setDateRange={setDateRange}
          className="border-b pb-4"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-fit">
            <TabsTrigger value="table" className="space-x-2">
              <Table size={16} />
              <span>Logs</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="space-x-2">
              <BarChart3 size={16} />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                {isLoading ? (
                  <div className="h-60 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <>
                    <LogTable
                      logs={filteredLogs}
                      onLogSelect={setSelectedLog}
                      className="border rounded-md"
                    />

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Showing {(logsData.page - 1) * logsData.pageSize + 1}-
                        {Math.min(logsData.page * logsData.pageSize, logsData.totalCount)} of {logsData.totalCount}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePageChange(logsData.page - 1)}
                          disabled={logsData.page === 1}
                        >
                          <ChevronLeft size={16} />
                        </Button>

                        <span className="text-sm">
                          {logsData.page} / {logsData.totalPages}
                        </span>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePageChange(logsData.page + 1)}
                          disabled={logsData.page >= logsData.totalPages}
                        >
                          <ChevronRight size={16} />
                        </Button>

                        <select
                          value={logsData.pageSize}
                          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                          className="text-sm border rounded px-2 py-1 bg-transparent"
                        >
                          {[10, 20, 50, 100].map(size => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="border rounded-md p-4">
                {selectedLog ? (
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Log Details</h3>
                    <pre className="text-xs p-3 bg-gray-50 rounded overflow-auto">
                      {JSON.stringify(selectedLog, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                    <Eye size={20} />
                    <p className="text-sm">Select a log to inspect</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-md p-4">
                <LogsPerTimeChart logs={filteredLogs} />
              </div>
              <div className="border rounded-md p-4">
                <LogsByLevelChart logs={filteredLogs} customColors={fetchedCustomColors} />
              </div>
            </div>
            <div className="border rounded-md p-4">
              <LogsByUserChart customColors={fetchedCustomColors} logs={filteredLogs} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}