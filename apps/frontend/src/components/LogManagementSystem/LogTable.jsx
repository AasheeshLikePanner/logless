import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock, User, Palette, X, ChevronDown, ChevronUp, Filter } from "lucide-react";

// Mock API functions - replace with your actual API imports
const getCustomColors = async () => {
  try {
    const response = await fetch('http://localhost:8080/api/logs/level/colors');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch custom colors:', error);
    return {};
  }
};

const saveCustomColor = async (level, color) => {
  try {
    await fetch(`http://localhost:8080/api/logs/level/colors/${level}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color })
    });
  } catch (error) {
    console.error('Failed to save custom color:', error);
  }
};

// Default colors for standard log levels
const DEFAULT_LEVEL_COLORS = {
  error: "#ef4444",
  warn: "#f59e0b", 
  info: "#3b82f6",
  debug: "#10b981",
  fatal: "#dc2626",
  success: "#22c55e"
};

// Fields that should be considered for exact grouping
const EXACT_GROUPING_FIELDS = ['message', 'level'];

const ColorPicker = ({ color, onColorChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempColor, setTempColor] = useState(color || "#3b82f6");

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-4 h-4 rounded border border-gray-300"
        style={{ backgroundColor: color || "#3b82f6" }}
      />
      {isOpen && (
        <div className="absolute top-6 left-0 z-50 bg-white p-2 rounded border shadow-lg">
          <input
            type="color"
            value={tempColor}
            onChange={(e) => setTempColor(e.target.value)}
            className="w-16 h-8 border-0 rounded"
          />
          <div className="flex gap-1 mt-2">
            <button
              onClick={() => {
                onColorChange(tempColor);
                setIsOpen(false);
              }}
              className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
            >
              Save
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-2 py-1 bg-gray-200 text-xs rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const LogTableRow = ({ 
  log, 
  onClick, 
  customColors, 
  onColorChange, 
  showBasic, 
  isExpanded, 
  onToggleExpand, 
  showGroupDetails 
}) => {
  const getLevelBadge = (level) => {
    if (showBasic) {
      return (
        <span className="px-2 py-1 text-xs rounded border bg-gray-50">
          {level}
        </span>
      );
    }

    const color = DEFAULT_LEVEL_COLORS[level] || customColors[level] || "#6b7280";
    const textColor = getContrastColor(color);

    return (
      <span 
        className="px-2 py-1 text-xs rounded font-medium"
        style={{ backgroundColor: color, color: textColor }}
      >
        {level}
      </span>
    );
  };

  const getContrastColor = (hexColor) => {
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 200 ? '#000000' : '#FFFFFF';
  };

  const hasVariations = log.variations && log.variations.length > 0;
  const shouldShowExpander = log.count > 1 || hasVariations;

  return (
    <>
      <tr 
        onClick={onClick} 
        className="cursor-pointer hover:bg-gray-50 border-b"
      >
        <td className="px-3 py-2 text-sm">
          <div className="flex items-center gap-2">
            <Clock size={12} className="text-gray-400" />
            <span>{new Date(log.timestamp).toLocaleString()}</span>
            {shouldShowExpander && (
              <button 
                className="p-1 hover:bg-gray-100 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand();
                }}
              >
                {isExpanded ? 
                  <ChevronUp size={12} /> : 
                  <ChevronDown size={12} />
                }
              </button>
            )}
          </div>
        </td>
        
        <td className="px-3 py-2">
          <div className="text-sm truncate max-w-md">
            {log.message}
          </div>
          {shouldShowExpander && !isExpanded && (
            <div className="flex gap-1 mt-1">
              <span className="px-1 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                {log.count}x
              </span>
              {hasVariations && (
                <span className="px-1 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                  {log.variations.length} var
                </span>
              )}
            </div>
          )}
        </td>
        
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            {getLevelBadge(log.level)}
            {!showBasic && !DEFAULT_LEVEL_COLORS[log.level] && (
              <ColorPicker
                color={customColors[log.level]}
                onColorChange={(color) => onColorChange(log.level, color)}
              />
            )}
          </div>
        </td>
        
        <td className="px-3 py-2 text-sm">
          {log.context?.userId ? (
            <div className="flex items-center gap-1">
              <User size={12} className="text-gray-400" />
              {log.context.userId}
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </td>
      </tr>
      
      {isExpanded && shouldShowExpander && (
        <tr className="bg-gray-50">
          <td colSpan={4} className="px-6 py-3">
            <div className="text-sm space-y-2">
              <div className="text-gray-600">
                <strong>Occurrences:</strong> {log.count} times
                <br />
                <strong>First:</strong> {new Date(log.firstOccurrence || log.timestamp).toLocaleString()}
                <br />
                <strong>Latest:</strong> {new Date(log.timestamp).toLocaleString()}
              </div>

              {hasVariations && showGroupDetails && (
                <div>
                  <strong className="text-gray-700">Context Variations:</strong>
                  <div className="mt-1 space-y-1 max-h-24 overflow-y-auto">
                    {log.variations.map((variation, i) => (
                      <div key={i} className="text-xs bg-white p-2 rounded border">
                        <div className="font-medium">
                          {new Date(variation.timestamp).toLocaleString()}
                        </div>
                        {variation.contextDiff && (
                          <div className="text-gray-600 mt-1">
                            {Object.entries(variation.contextDiff).map(([key, value]) => (
                              <div key={key}>
                                <span className="font-medium">{key}:</span> {JSON.stringify(value)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default function LogTable({ logs, onLogSelect }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [customColors, setCustomColors] = useState({});
  const [showBasic, setShowBasic] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const logsPerPage = 10;
  
  // Fetch custom colors on mount
  useEffect(() => {
    const fetchColors = async () => {
      const colors = await getCustomColors();
      setCustomColors(colors);
    };
    fetchColors();
  }, []);

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const getContextDifference = (context1, context2) => {
    const diff = {};
    const allKeys = new Set([
      ...Object.keys(context1 || {}),
      ...Object.keys(context2 || {})
    ]);
    
    allKeys.forEach(key => {
      if (context1?.[key] !== context2?.[key]) {
        diff[key] = context2?.[key];
      }
    });
    
    return diff;
  };


  // Smart grouping logic
  const processedLogs = logs.reduce((acc, log, index) => {
    const existingIndex = acc.findIndex(existing => {
      // Must match exact fields
      const exactMatch = EXACT_GROUPING_FIELDS.every(field => {
        const existingValue = getNestedValue(existing, field);
        const currentValue = getNestedValue(log, field);
        return existingValue === currentValue;
      });
      
      if (!exactMatch) return false;
      
      // Time proximity check (within 5 minutes)
      const timeDiff = new Date(log.timestamp) - new Date(existing.timestamp);
      return Math.abs(timeDiff) < 5 * 60 * 1000;
    });

    if (existingIndex !== -1) {
      // Group with existing log
      const existing = acc[existingIndex];
      existing.count = (existing.count || 1) + 1;
      existing.timestamp = log.timestamp;
      
      if (!existing.firstOccurrence) {
        existing.firstOccurrence = existing.timestamp;
      }
      
      // Track context variations
      const contextDiff = getContextDifference(existing.context, log.context);
      if (Object.keys(contextDiff).length > 0) {
        if (!existing.variations) existing.variations = [];
        existing.variations.push({
          timestamp: log.timestamp,
          contextDiff
        });
      }
    } else {
      // Create new log entry
      acc.push({
        ...log,
        count: 1,
        firstOccurrence: log.timestamp
      });
    }
    
    return acc;
  }, []);

  // Helper functions
  

  const handleColorChange = async (level, color) => {
    setCustomColors(prev => ({ ...prev, [level]: color }));
    await saveCustomColor(level, color);
  };

  const toggleExpand = (index) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const totalPages = Math.ceil(processedLogs.length / logsPerPage);
  const startIndex = (currentPage - 1) * logsPerPage;
  const displayedLogs = processedLogs.slice(startIndex, startIndex + logsPerPage);

  return (
    <div className="bg-white border rounded">
      {/* Minimal Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b bg-gray-50">
        <div className="text-sm text-gray-600">
          {logs.length} logs • {processedLogs.length} grouped
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowGroupDetails(!showGroupDetails)}
            className={`px-2 py-1 text-xs rounded ${
              showGroupDetails ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
            }`}
          >
            <Filter size={12} className="inline mr-1" />
            Details
          </button>
          
          <button
            onClick={() => setShowBasic(!showBasic)}
            className={`px-2 py-1 text-xs rounded ${
              !showBasic ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'
            }`}
          >
            {showBasic ? <Palette size={12} /> : <X size={12} />}
          </button>
        </div>
      </div>

      {/* Minimal Table */}
      <table className="w-full">
        <thead className="bg-gray-50 text-xs text-gray-500">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Time</th>
            <th className="px-3 py-2 text-left font-medium">Message</th>
            <th className="px-3 py-2 text-left font-medium">Level</th>
            <th className="px-3 py-2 text-left font-medium">User</th>
          </tr>
        </thead>
        <tbody>
          {displayedLogs.map((log, index) => (
            <LogTableRow
              key={startIndex + index}
              log={log}
              onClick={() => onLogSelect(log)}
              customColors={customColors}
              onColorChange={handleColorChange}
              showBasic={showBasic}
              isExpanded={expandedRows.has(startIndex + index)}
              onToggleExpand={() => toggleExpand(startIndex + index)}
              showGroupDetails={showGroupDetails}
            />
          ))}
        </tbody>
      </table>

      {/* Minimal Pagination */}
      <div className="flex justify-between items-center px-4 py-3 border-t bg-gray-50 text-sm">
        <span className="text-gray-600">
          {startIndex + 1}-{Math.min(startIndex + logsPerPage, processedLogs.length)} of {processedLogs.length}
        </span>
        
        <div className="flex gap-1">
          <button
            disabled={currentPage === 1}
            onClick={() => {
              setCurrentPage(p => Math.max(1, p - 1));
              setExpandedRows(new Set());
            }}
            className="px-2 py-1 border rounded text-xs disabled:opacity-50"
          >
            <ChevronLeft size={12} />
          </button>
          
          <span className="px-2 py-1 text-xs">
            {currentPage}/{totalPages}
          </span>
          
          <button
            disabled={currentPage === totalPages}
            onClick={() => {
              setCurrentPage(p => Math.min(totalPages, p + 1));
              setExpandedRows(new Set());
            }}
            className="px-2 py-1 border rounded text-xs disabled:opacity-50"
          >
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}