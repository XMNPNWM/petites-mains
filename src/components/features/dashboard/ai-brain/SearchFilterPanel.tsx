
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Filter } from 'lucide-react';

export interface FilterState {
  searchTerm: string;
  confidenceLevel: 'all' | 'high' | 'medium' | 'low';
  extractionStatus: 'all' | 'new' | 'existing';
  categoryType: 'all' | 'character' | 'location' | 'theme' | 'setting' | 'plot';
  verificationStatus: 'all' | 'flagged' | 'verified' | 'unverified';
  chapterFilter: 'all' | string; // 'all' or chapter ID
}

export interface Chapter {
  id: string;
  title: string;
  order_index: number;
}

interface SearchFilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  resultsCount: number;
  chapters?: Chapter[];
}

const SearchFilterPanel = ({ filters, onFiltersChange, resultsCount, chapters = [] }: SearchFilterPanelProps) => {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, searchTerm: value });
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: '',
      confidenceLevel: 'all',
      extractionStatus: 'all',
      categoryType: 'all',
      verificationStatus: 'all',
      chapterFilter: 'all'
    });
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => 
    key !== 'searchTerm' && value !== 'all'
  ).length + (filters.searchTerm ? 1 : 0);

  return (
    <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search across all knowledge items..."
          value={filters.searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {filters.searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
            onClick={() => handleSearchChange('')}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center space-x-1">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Filters:</span>
        </div>

        <Select
          value={filters.confidenceLevel}
          onValueChange={(value) => handleFilterChange('confidenceLevel', value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Confidence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Confidence</SelectItem>
            <SelectItem value="high">High (80%+)</SelectItem>
            <SelectItem value="medium">Medium (60-80%)</SelectItem>
            <SelectItem value="low">Low (&lt;60%)</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.extractionStatus}
          onValueChange={(value) => handleFilterChange('extractionStatus', value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="existing">Existing</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.categoryType}
          onValueChange={(value) => handleFilterChange('categoryType', value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="character">Characters</SelectItem>
            <SelectItem value="location">Locations</SelectItem>
            <SelectItem value="theme">Themes</SelectItem>
            <SelectItem value="setting">Settings</SelectItem>
            <SelectItem value="plot">Plot</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.verificationStatus}
          onValueChange={(value) => handleFilterChange('verificationStatus', value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Verification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.chapterFilter}
          onValueChange={(value) => handleFilterChange('chapterFilter', value)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Chapter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Chapters</SelectItem>
            {chapters.map((chapter) => (
              <SelectItem key={chapter.id} value={chapter.id}>
                Ch. {chapter.order_index}: {chapter.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeFiltersCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="text-slate-600"
          >
            Clear All ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Active Filters & Results Count */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {filters.searchTerm && (
            <Badge variant="secondary" className="text-xs">
              Search: "{filters.searchTerm}"
              <Button
                variant="ghost"
                size="icon"
                className="ml-1 h-3 w-3 p-0"
                onClick={() => handleSearchChange('')}
              >
                <X className="w-2 h-2" />
              </Button>
            </Badge>
          )}
          {filters.confidenceLevel !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Confidence: {filters.confidenceLevel}
            </Badge>
          )}
          {filters.extractionStatus !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Status: {filters.extractionStatus}
            </Badge>
          )}
          {filters.categoryType !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Category: {filters.categoryType}
            </Badge>
          )}
           {filters.verificationStatus !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Verification: {filters.verificationStatus}
            </Badge>
          )}
          {filters.chapterFilter !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Chapter: {chapters.find(c => c.id === filters.chapterFilter)?.title || 'Unknown'}
            </Badge>
          )}
        </div>
        
        <div className="text-sm text-slate-600">
          {resultsCount} {resultsCount === 1 ? 'result' : 'results'}
        </div>
      </div>
    </div>
  );
};

export default SearchFilterPanel;
