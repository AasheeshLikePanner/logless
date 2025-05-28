import { useState } from "react";
import { Search } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import CalendarDateRangePicker from "./CalendarDateRangePicker";

export default function SearchFilters({ onSearch, onFilter, dateRange, setDateRange }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    logLevel: undefined,
    userId: undefined,
    endpoint: undefined
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
            <Select 
              onValueChange={value => handleFilterChange("logLevel", value)}
              value={filters.logLevel}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INFO">Info</SelectItem>
                <SelectItem value="WARN">Warning</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
                <SelectItem value="DEBUG">Debug</SelectItem>
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
}