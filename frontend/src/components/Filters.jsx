import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Filter, X } from 'lucide-react';

const Filters = ({ filters, onFiltersChange }) => {
    const [showFilters, setShowFilters] = useState(false);

    const handleFilterChange = (key, value) => {
        onFiltersChange({
            ...filters,
            [key]: value
        });
    };

    const clearFilters = () => {
        onFiltersChange({
            sender: '',
            domain: '',
            date_from: '',
            date_to: '',
            has_attachments: false,
            is_decision: false
        });
    };

    const activeFiltersCount = Object.values(filters).filter(v => v && v !== '').length;

    return (
        <div className="space-y-2">
            <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
            >
                <Filter className="h-4 w-4" />
                Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>

            {showFilters && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Search Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Sender Filter */}
                            <div className="space-y-2">
                                <Label htmlFor="sender">Sender</Label>
                                <Input
                                    id="sender"
                                    type="text"
                                    value={filters.sender}
                                    onChange={(e) => handleFilterChange('sender', e.target.value)}
                                    placeholder="e.g., john@example.com"
                                />
                            </div>

                            {/* Domain Filter */}
                            <div className="space-y-2">
                                <Label htmlFor="domain">Domain</Label>
                                <Input
                                    id="domain"
                                    type="text"
                                    value={filters.domain}
                                    onChange={(e) => handleFilterChange('domain', e.target.value)}
                                    placeholder="e.g., stripe.com"
                                />
                            </div>

                            {/* Date From */}
                            <div className="space-y-2">
                                <Label htmlFor="date_from">Date From</Label>
                                <Input
                                    id="date_from"
                                    type="date"
                                    value={filters.date_from}
                                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                />
                            </div>

                            {/* Date To */}
                            <div className="space-y-2">
                                <Label htmlFor="date_to">Date To</Label>
                                <Input
                                    id="date_to"
                                    type="date"
                                    value={filters.date_to}
                                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                />
                            </div>

                            {/* Has Attachments */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="has_attachments"
                                    checked={filters.has_attachments}
                                    onCheckedChange={(checked) => handleFilterChange('has_attachments', checked)}
                                />
                                <Label
                                    htmlFor="has_attachments"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                    Has Attachments
                                </Label>
                            </div>

                            {/* Decisions Only */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_decision"
                                    checked={filters.is_decision}
                                    onCheckedChange={(checked) => handleFilterChange('is_decision', checked)}
                                />
                                <Label
                                    htmlFor="is_decision"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-1"
                                >
                                    Decisions Only ⚡
                                </Label>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={clearFilters}
                                className="gap-2"
                            >
                                <X className="h-4 w-4" />
                                Clear All Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default Filters;