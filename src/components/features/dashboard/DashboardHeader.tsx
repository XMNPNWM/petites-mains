
import React from 'react';
import { Star, User, FileText, Clock, LogOut, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useUserCreditStatus } from '@/hooks/useUserCreditStatus';
import Logo from '@/components/ui/logo';

const DashboardHeader = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { creditStatus, loading } = useUserCreditStatus();
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };
  
  const handleLogoClick = () => {
    navigate('/');
  };
  
  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  
  return (
    <TooltipProvider>
      <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div 
            onClick={handleLogoClick}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleLogoClick();
              }
            }}
          >
            <Logo className="h-16 w-auto" />
          </div>
          
          <div className="flex items-center space-x-4">
            {/* AI Credit Usage Progress */}
            {!loading && creditStatus && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">
                          {creditStatus.credits_remaining}/{creditStatus.credits_limit}
                        </span>
                        <span className="text-xs text-slate-500">AI credits</span>
                      </div>
                      <Progress 
                        value={(creditStatus.credits_used / creditStatus.credits_limit) * 100} 
                        className="w-24 h-2"
                      />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>AI Credits Used: {creditStatus.credits_used} / {creditStatus.credits_limit}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Chat: 1 credit • Enhancement: 2 credits • Analysis: 2 credits
                  </p>
                </TooltipContent>
              </Tooltip>
            )}

            <div className="flex items-center space-x-3">
            {/* Subscription Button */}
            <Button onClick={() => navigate('/subscription')} className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium" size="sm">
              <Star className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Button>

            {/* User Account Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar_url || undefined} alt="User avatar" />
                    <AvatarFallback>
                      {getInitials(profile?.full_name || user?.user_metadata?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/subscription')}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Subscription</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/analytics')}>
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Global Analytics</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
};

export default DashboardHeader;
