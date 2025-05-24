
import React from 'react';
import { Star, User, FileText, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const DashboardHeader = () => {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Petites Mains</h1>
            <p className="text-slate-600 mt-2">Your creative writing workspace</p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Subscription Button */}
            <Button 
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium"
              size="sm"
            >
              <Star className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Button>

            {/* User Account Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder.svg" alt="User avatar" />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Subscription</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Global Analytics</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
