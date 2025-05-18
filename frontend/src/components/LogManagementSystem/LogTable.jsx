import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, User } from "lucide-react";

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

export default function LogTable({ logs, onLogSelect }) {
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
}