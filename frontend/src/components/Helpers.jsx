import { useState, useEffect } from "react";

import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  Info, 
  User, 
} from "lucide-react";
import {
  Table as UITable,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarDateRangePicker } from "./LogManagementSystem/CalendarDateRangePicker";
import _ from "lodash";

// Helper components
const DateRangePicker = () => {
  return (
    <div className="grid gap-2">
      <CalendarDateRangePicker />
    </div>
  );
};

const LogLevelBadge = ({ level }) => {
  const levelConfig = {
    ERROR: { color: "bg-red-100 text-red-800 border-red-200", icon: <AlertCircle size={12} className="mr-1" /> },
    WARN: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: <AlertCircle size={12} className="mr-1" /> },
    INFO: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: <Info size={12} className="mr-1" /> },
    DEBUG: { color: "bg-green-100 text-green-800 border-green-200", icon: <Info size={12} className="mr-1" /> },
  };

  const config = levelConfig[level] || levelConfig.INFO;

  return (
    <Badge variant="outline" className={`flex items-center ${config.color} border px-2 py-1 rounded-full text-xs font-medium`}>
      {config.icon}
      {level}
    </Badge>
  );
};

const LogTableRow = ({ log, onClick }) => {
  const { TimeStamp, Message, LogLevel, Context } = log;
  const date = new Date(TimeStamp);
  const formattedTime = date.toLocaleTimeString();
  const formattedDate = date.toLocaleDateString();
  
  return (
    <TableRow onClick={onClick} className="cursor-pointer hover:bg-gray-50">
      <TableCell className="font-medium">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">{formattedDate}</span>
          <span className="flex items-center gap-1 text-xs">
            <Clock size={12} />
            {formattedTime}
          </span>
        </div>
      </TableCell>
      <TableCell className="max-w-md truncate">{Message}</TableCell>
      <TableCell>
        <LogLevelBadge level={LogLevel} />
      </TableCell>
      <TableCell className="text-sm">
        {Context?.userId ? (
          <div className="flex items-center gap-1">
            <User size={12} />
            {Context.userId}
          </div>
        ) : null}
      </TableCell>
    </TableRow>
  );
};

const LogDetails = ({ log }) => {
  if (!log) return null;

  return (
    <div className="p-4 bg-gray-50 rounded-md border">
      <h3 className="font-medium mb-2">Log Details</h3>
      <pre className="bg-black text-green-400 p-4 rounded-md overflow-auto text-xs">
        {JSON.stringify(log, null, 2)}
      </pre>
    </div>
  );
};
