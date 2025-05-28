import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock, User, Palette, X } from "lucide-react";
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { HexColorPicker } from "react-colorful";
import axios from "axios";
import { getCustomColors } from "@/apis/api";

// Default colors for standard log levels
const DEFAULT_LEVEL_COLORS = {
  error: "#ef4444",
  warn: "#f59e0b",
  info: "#3b82f6",
  debug: "#10b981",
  fatal: "#dc2626",
  success: "#22c55e"
};

const LogTableRow = ({ log, onClick, customColors, onColorChange, showBasic }) => {
  const getLevelBadge = (level) => {
    if (showBasic) {
      return <Badge variant="outline">{level}</Badge>;
    }

    if (level === 'error' || level === 'fatal' || level === 'warn' || level === 'success' || level === 'info' || level === 'debug' ) {
      return (
        <Badge
          style={{
            backgroundColor: DEFAULT_LEVEL_COLORS[level],
            color: '#fff'
          }}
        >
          {level}
        </Badge>
      );
    } else if (customColors[level]) {
      return (
        <Badge
          style={{
            backgroundColor: customColors[level],
            color: getContrastColor(customColors[level])
          }}
        >
          {level}
        </Badge>
      );
    }

  };


  // Helper function to determine text color based on background
  const getContrastColor = (hexColor) => {
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 200 ? '#000000' : '#FFFFFF';
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
        <div className="flex items-center gap-2">
          {getLevelBadge(log.Level)}
          {!showBasic && !DEFAULT_LEVEL_COLORS[log.Level] && (
            <ColorPicker
              color={customColors[log.Level]}
              onColorChange={(color) => onColorChange(log.Level, color)}
            />
          )}
        </div>
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

const ColorPicker = ({ color, onColorChange }) => {
  const [currentColor, setCurrentColor] = useState(color || '#000000');

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 p-1">
          <Palette size={14} className="text-gray-500 hover:text-gray-700" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-3 space-y-2">
        <HexColorPicker
          color={currentColor}
          onChange={setCurrentColor}
        />
        <div className="flex items-center gap-2">
          <Input
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            className="h-8 w-24"
          />
          <Button
            size="sm"
            onClick={() => onColorChange(currentColor)}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default function LogTable({ logs, onLogSelect }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [customColors, setCustomColors] = useState({});
  const [showBasic, setShowBasic] = useState(true);
  const logsPerPage = 10;
  const totalPages = Math.ceil(logs.length / logsPerPage);

  const startIndex = (currentPage - 1) * logsPerPage;
  const displayedLogs = logs.slice(startIndex, startIndex + logsPerPage);

  // Fetch custom colors from backend on component mount
  useEffect(() => {
    const fetchCustomColors = async () => {
      const response = await getCustomColors();
      setCustomColors(response);
    };

    fetchCustomColors();
  }, []);

  const handleColorChange = async (level, color) => {
    const newColors = { ...customColors, [level]: color };
    setCustomColors(newColors);

    // Update backend with new colors
    try {
      const response = await axios.post(`http://localhost:8080/api/logs/level/colors/${level}`, {
        color
      });
      console.log(response.data);

    } catch (error) {
      console.error('Failed to save custom colors:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowBasic(!showBasic)}
          className="flex items-center gap-1"
        >
          {showBasic ? (
            <>
              <Palette size={14} />
              <span>Show Custom Colors</span>
            </>
          ) : (
            <>
              <X size={14} />
              <span>Show Basic</span>
            </>
          )}
        </Button>
      </div>

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
              customColors={customColors}
              onColorChange={handleColorChange}
              showBasic={showBasic}
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