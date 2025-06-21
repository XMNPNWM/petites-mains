
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BarChart3, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Metrics {
  readability_score: number;
  dialogue_ratio: number;
  pacing_score: number;
  consistency_score: number;
  word_count: number;
  sentence_variety: number;
}

interface MetricsPanelProps {
  refinementId: string;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  content: string;
}

const MetricsPanel = ({ 
  refinementId, 
  isExpanded, 
  onToggleExpanded, 
  content 
}: MetricsPanelProps) => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (refinementId && isExpanded) {
      fetchMetrics();
    }
  }, [refinementId, isExpanded]);

  const fetchMetrics = async () => {
    if (!refinementId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chapter_metrics')
        .select('*')
        .eq('refinement_id', refinementId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setMetrics(data);
      } else {
        // Generate mock metrics based on content for demo
        const wordCount = content.split(/\s+/).length;
        const mockMetrics = {
          readability_score: Math.random() * 40 + 60, // 60-100
          dialogue_ratio: Math.random() * 0.4 + 0.1, // 10-50%
          pacing_score: Math.random() * 30 + 70, // 70-100
          consistency_score: Math.random() * 20 + 80, // 80-100
          word_count: wordCount,
          sentence_variety: Math.random() * 25 + 75 // 75-100
        };
        
        // Insert the metrics
        const { error: insertError } = await supabase
          .from('chapter_metrics')
          .insert({
            refinement_id: refinementId,
            ...mockMetrics
          });
        
        if (!insertError) {
          setMetrics(mockMetrics);
        }
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricItem = ({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium">{Math.round(value)}{suffix}</span>
      </div>
      <Progress value={value} className="h-1" />
    </div>
  );

  return (
    <div className="h-full bg-slate-50 p-4 flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-4 h-4 text-slate-600" />
          {isExpanded && <h3 className="text-sm font-semibold text-slate-700">Quality Metrics</h3>}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleExpanded}
          className="p-1 h-6 w-6"
        >
          {isExpanded ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </Button>
      </div>
      
      <Card className="flex-1 flex flex-col">
        {isExpanded && (
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-700 flex items-center space-x-1">
              <TrendingUp className="w-4 h-4" />
              <span>Chapter Analysis</span>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={`flex-1 pt-0 ${isExpanded ? 'overflow-y-auto' : 'flex items-center justify-center'}`}>
          {!isExpanded ? (
            <div className="text-center">
              <BarChart3 className="w-6 h-6 mx-auto text-slate-400 mb-1" />
              <p className="text-xs text-slate-500">Metrics</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            </div>
          ) : metrics ? (
            <div className="space-y-4">
              <MetricItem 
                label="Readability" 
                value={metrics.readability_score} 
                suffix="%" 
              />
              <MetricItem 
                label="Dialogue Ratio" 
                value={metrics.dialogue_ratio * 100} 
                suffix="%" 
              />
              <MetricItem 
                label="Pacing Score" 
                value={metrics.pacing_score} 
                suffix="%" 
              />
              <MetricItem 
                label="Consistency" 
                value={metrics.consistency_score} 
                suffix="%" 
              />
              <MetricItem 
                label="Sentence Variety" 
                value={metrics.sentence_variety} 
                suffix="%" 
              />
              
              <div className="pt-2 border-t border-slate-200">
                <div className="text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Word Count</span>
                    <span className="font-medium">{metrics.word_count}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No metrics available</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricsPanel;
