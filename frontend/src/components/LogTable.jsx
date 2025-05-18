import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line 
} from "recharts";
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  Info, 
  User, 
  Search, 
  Filter, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  BarChart3,
  Table
} from "lucide-react";
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarDateRangePicker } from "./DateRangePicker";
import _ from "lodash";


// Main components
const LogTable = ({ logs, onLogSelect }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;
  const totalPages = Math.ceil(logs.length / logsPerPage);
  
  const startIndex = (currentPage - 1) * logsPerPage;
  const displayedLogs = logs.slice(startIndex, startIndex + logsPerPage);
  
  return (
    <div className="space-y-4">
      <UITable>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px]">Timestamp</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>User</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedLogs.map((log, index) => (
            <LogTableRow 
              key={index} 
              log={log} 
              onClick={() => onLogSelect(log)} 
            />
          ))}
        </TableBody>
      </UITable>
      
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {startIndex + 1}-{Math.min(startIndex + logsPerPage, logs.length)} of {logs.length} logs
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="outline" 
            size="icon"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} />
          </Button>
          <div className="text-sm px-2">
            Page {currentPage} of {totalPages}
          </div>
          <Button 
            variant="outline" 
            size="icon"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

const LogTableRow = ({ log, onClick }) => {
  const getLevelBadge = (level) => {
    switch (level) {
      case 'ERROR':
        return <Badge variant="destructive">Error</Badge>;
      case 'WARN':
        return <Badge variant="warning">Warning</Badge>;
      case 'INFO':
        return <Badge variant="default">Info</Badge>;
      case 'DEBUG':
        return <Badge variant="secondary">Debug</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  return (
    <TableRow onClick={onClick} className="cursor-pointer hover:bg-gray-50">
      <TableCell className="font-medium">
        <div className="flex items-center gap-1">
          <Clock size={14} className="text-gray-500" />
          {new Date(log.TimeStamp).toLocaleString()}
        </div>
      </TableCell>
      <TableCell className="max-w-[300px] truncate">
        {log.Message}
      </TableCell>
      <TableCell>
        {getLevelBadge(log.LogLevel)}
      </TableCell>
      <TableCell>
        {log.Context?.userId ? (
          <div className="flex items-center gap-1">
            <User size={14} className="text-gray-500" />
            {log.Context.userId}
          </div>
        ) : 'N/A'}
      </TableCell>
    </TableRow>
  );
};

const SearchFilters = ({ onSearch, onFilter }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState();
  const [filters, setFilters] = useState({
    logLevel: "",
    userId: "",
    endpoint: ""
  });
  
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Search & Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              type="text" 
              placeholder="Search logs..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button type="submit" size="sm">Search</Button>
        </form>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">Log Level</label>
            <Select onValueChange={value => handleFilterChange("logLevel", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Levels</SelectItem>
                <SelectItem value="INFO">Info</SelectItem>
                <SelectItem value="WARN">Warning</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
                <SelectItem value="DEBUG">Debug</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium">User ID</label>
            <Select onValueChange={value => handleFilterChange("userId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Users</SelectItem>
                <SelectItem value="abc123">abc123</SelectItem>
                <SelectItem value="def456">def456</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium">Date Range</label>
            <CalendarDateRangePicker 
              date={dateRange}
              setDate={setDateRange}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
const LogsPerTimeChart = ({ logs }) => {
  // Group logs by hour
  const logsByHour = _.groupBy(logs, log => {
    const date = new Date(log.TimeStamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
  });
  
  const chartData = Object.entries(logsByHour).map(([hour, logs]) => ({
    hour,
    count: logs.length,
    errors: logs.filter(log => log.LogLevel === 'ERROR').length
  }));
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Logs Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#8884d8" name="All Logs" />
            <Line type="monotone" dataKey="errors" stroke="#ff0000" name="Errors" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

const LogsByLevelChart = ({ logs }) => {
  const logsByLevel = _.groupBy(logs, 'LogLevel');
  
  const chartData = Object.entries(logsByLevel).map(([level, logs]) => ({
    level,
    count: logs.length
  }));
  
  const colors = {
    ERROR: "#ef4444",
    WARN: "#f59e0b",
    INFO: "#3b82f6",
    DEBUG: "#10b981"
  };
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Logs by Level</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="level" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" name="Count">
              {chartData.map((entry, index) => (
                <Bar 
                  key={`cell-${index}`} 
                  fill={colors[entry.level] || "#8884d8"} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

const LogsByUserChart = ({ logs }) => {
  const logsByUser = _.groupBy(logs, log => log.Context?.userId || 'unknown');
  
  const chartData = Object.entries(logsByUser).map(([userId, logs]) => ({
    userId: userId === 'unknown' ? 'No User' : userId,
    count: logs.length
  }));
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Logs by User</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="userId" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" name="Logs" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};