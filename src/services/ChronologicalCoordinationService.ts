import { supabase } from '@/integrations/supabase/client';

interface TemporalMarker {
  text: string;
  type: 'absolute' | 'relative' | 'sequence';
  confidence: number;
  order_hint?: number;
}

interface NarrativeElement {
  id: string;
  type: 'plot_point' | 'plot_thread' | 'timeline_event' | 'character_relationship' | 'chapter_summary';
  name: string;
  temporal_markers: string[];
  dependency_elements: string[];
  chronological_order: number;
  chronological_confidence: number;
}

export class ChronologicalCoordinationService {
  /**
   * Assign chronological order to all story elements for a project
   */
  static async assignChronologicalOrder(projectId: string): Promise<{
    elementsProcessed: number;
    sequencesCreated: number;
    coordinationResults: any;
  }> {
    console.log(`🕒 Starting chronological coordination for project ${projectId}`);

    try {
      // Step 1: Gather all narrative elements
      const elements = await this.gatherNarrativeElements(projectId);
      console.log(`📊 Gathered ${elements.length} narrative elements`);

      // Step 2: Analyze temporal markers and dependencies
      const coordinatedElements = await this.analyzeTemporalRelationships(elements);
      console.log(`🔗 Analyzed temporal relationships for ${coordinatedElements.length} elements`);

      // Step 3: Build chronological sequence
      const sequencedElements = await this.buildChronologicalSequence(coordinatedElements);
      console.log(`📈 Built chronological sequence with ${sequencedElements.length} elements`);

      // Step 4: Update database with new chronological order
      const updateResults = await this.updateDatabaseWithSequence(projectId, sequencedElements);
      console.log(`💾 Updated database with coordination results`);

      return {
        elementsProcessed: elements.length,
        sequencesCreated: this.countNarrativeSequences(sequencedElements),
        coordinationResults: updateResults
      };

    } catch (error) {
      console.error('❌ Chronological coordination failed:', error);
      throw error;
    }
  }

  /**
   * Gather all narrative elements from the database
   */
  private static async gatherNarrativeElements(projectId: string): Promise<NarrativeElement[]> {
    const elements: NarrativeElement[] = [];

    // Fetch timeline events
    const { data: timelineEvents } = await supabase
      .from('timeline_events')
      .select('*')
      .eq('project_id', projectId);

    if (timelineEvents) {
      elements.push(...timelineEvents.map(event => ({
        id: event.id,
        type: 'timeline_event' as const,
        name: event.event_summary || event.event_name || 'Unnamed Event',
        temporal_markers: Array.isArray(event.temporal_markers) ? event.temporal_markers as string[] : [],
        dependency_elements: Array.isArray(event.dependency_elements) ? event.dependency_elements as string[] : [],
        chronological_order: event.chronological_order || 0,
        chronological_confidence: event.chronological_confidence || 0.5
      })));
    }

    // Fetch plot points
    const { data: plotPoints } = await supabase
      .from('plot_points')
      .select('*')
      .eq('project_id', projectId);

    if (plotPoints) {
      elements.push(...plotPoints.map(point => ({
        id: point.id,
        type: 'plot_point' as const,
        name: point.name || 'Unnamed Plot Point',
        temporal_markers: Array.isArray(point.temporal_markers) ? point.temporal_markers as string[] : [],
        dependency_elements: Array.isArray(point.dependency_elements) ? point.dependency_elements as string[] : [],
        chronological_order: point.chronological_order || 0,
        chronological_confidence: point.chronological_confidence || 0.5
      })));
    }

    // Fetch plot threads
    const { data: plotThreads } = await supabase
      .from('plot_threads')
      .select('*')
      .eq('project_id', projectId);

    if (plotThreads) {
      elements.push(...plotThreads.map(thread => ({
        id: thread.id,
        type: 'plot_thread' as const,
        name: thread.thread_name || 'Unnamed Plot Thread',
        temporal_markers: Array.isArray(thread.temporal_markers) ? thread.temporal_markers as string[] : [],
        dependency_elements: Array.isArray(thread.dependency_elements) ? thread.dependency_elements as string[] : [],
        chronological_order: thread.chronological_order || 0,
        chronological_confidence: thread.chronological_confidence || 0.5
      })));
    }

    // Fetch character relationships
    const { data: relationships } = await supabase
      .from('character_relationships')
      .select('*')
      .eq('project_id', projectId);

    if (relationships) {
      elements.push(...relationships.map(rel => ({
        id: rel.id,
        type: 'character_relationship' as const,
        name: `${rel.character_a_name} - ${rel.character_b_name}`,
        temporal_markers: Array.isArray(rel.temporal_markers) ? rel.temporal_markers as string[] : [],
        dependency_elements: Array.isArray(rel.dependency_elements) ? rel.dependency_elements as string[] : [],
        chronological_order: rel.chronological_order || 0,
        chronological_confidence: rel.chronological_confidence || 0.5
      })));
    }

    // Fetch chapter summaries
    const { data: chapterSummaries } = await supabase
      .from('chapter_summaries')
      .select('*')
      .eq('project_id', projectId);

    if (chapterSummaries) {
      elements.push(...chapterSummaries.map(summary => ({
        id: summary.id,
        type: 'chapter_summary' as const,
        name: summary.title || 'Unnamed Chapter',
        temporal_markers: Array.isArray(summary.temporal_markers) ? summary.temporal_markers as string[] : [],
        dependency_elements: Array.isArray(summary.dependency_elements) ? summary.dependency_elements as string[] : [],
        chronological_order: summary.chronological_order || 0,
        chronological_confidence: summary.chronological_confidence || 0.5
      })));
    }

    return elements;
  }

  /**
   * Analyze temporal relationships between elements
   */
  private static async analyzeTemporalRelationships(elements: NarrativeElement[]): Promise<NarrativeElement[]> {
    const coordinatedElements = [...elements];

    // Parse temporal markers for each element
    for (const element of coordinatedElements) {
      const parsedMarkers = this.parseTemporalMarkers(element.temporal_markers);
      element.temporal_markers = parsedMarkers.map(marker => marker.text);
      
      // Calculate initial chronological confidence based on temporal markers
      const markerConfidence = parsedMarkers.reduce((acc, marker) => acc + marker.confidence, 0) / Math.max(1, parsedMarkers.length);
      element.chronological_confidence = Math.max(element.chronological_confidence, markerConfidence);
    }

    // Analyze cross-references and dependencies
    this.analyzeDependencies(coordinatedElements);

    return coordinatedElements;
  }

  /**
   * Parse temporal markers to extract chronological hints
   */
  private static parseTemporalMarkers(markers: string[]): TemporalMarker[] {
    const parsed: TemporalMarker[] = [];

    for (const marker of markers) {
      if (!marker) continue;

      // Absolute time references
      if (marker.match(/\b(day|week|month|year|morning|afternoon|evening|night)\b/i)) {
        parsed.push({
          text: marker,
          type: 'absolute',
          confidence: 0.8
        });
      }
      // Relative time references
      else if (marker.match(/\b(before|after|during|while|then|next|later|earlier|first|last)\b/i)) {
        parsed.push({
          text: marker,
          type: 'relative',
          confidence: 0.6
        });
      }
      // Sequence indicators
      else if (marker.match(/\b(chapter|scene|part|act)\s+\d+/i)) {
        parsed.push({
          text: marker,
          type: 'sequence',
          confidence: 0.9
        });
      }
      // Generic temporal marker
      else {
        parsed.push({
          text: marker,
          type: 'relative',
          confidence: 0.4
        });
      }
    }

    return parsed;
  }

  /**
   * Analyze dependencies between narrative elements
   */
  private static analyzeDependencies(elements: NarrativeElement[]): void {
    for (const element of elements) {
      // Find elements that this element depends on
      const dependencies = elements.filter(other => 
        element.dependency_elements.some(dep => 
          other.name.toLowerCase().includes(dep.toLowerCase()) ||
          dep.toLowerCase().includes(other.name.toLowerCase())
        )
      );

      // Adjust chronological order based on dependencies
      if (dependencies.length > 0) {
        const maxDependencyOrder = Math.max(...dependencies.map(dep => dep.chronological_order));
        if (element.chronological_order <= maxDependencyOrder) {
          element.chronological_order = maxDependencyOrder + 1;
          element.chronological_confidence = Math.max(0.7, element.chronological_confidence);
        }
      }
    }
  }

  /**
   * Build final chronological sequence
   */
  private static async buildChronologicalSequence(elements: NarrativeElement[]): Promise<NarrativeElement[]> {
    // Sort elements by multiple criteria
    const sorted = elements.sort((a, b) => {
      // Primary: chronological_order
      if (a.chronological_order !== b.chronological_order) {
        return a.chronological_order - b.chronological_order;
      }
      
      // Secondary: element type priority (timeline events first)
      const typePriority = {
        'timeline_event': 1,
        'plot_point': 2,
        'plot_thread': 3,
        'character_relationship': 4,
        'chapter_summary': 5
      };
      
      const aPriority = typePriority[a.type] || 6;
      const bPriority = typePriority[b.type] || 6;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Tertiary: chronological confidence (higher first)
      return b.chronological_confidence - a.chronological_confidence;
    });

    // Reassign chronological order based on final sequence
    sorted.forEach((element, index) => {
      element.chronological_order = index + 1;
    });

    return sorted;
  }

  /**
   * Update database with new chronological sequence
   */
  private static async updateDatabaseWithSequence(projectId: string, elements: NarrativeElement[]): Promise<any> {
    const results = {
      timeline_events: 0,
      plot_points: 0,
      plot_threads: 0,
      character_relationships: 0,
      chapter_summaries: 0
    };

    // Group elements by type
    const elementsByType = elements.reduce((acc, element) => {
      if (!acc[element.type]) acc[element.type] = [];
      acc[element.type].push(element);
      return acc;
    }, {} as Record<string, NarrativeElement[]>);

    // Update each table
    for (const [type, typeElements] of Object.entries(elementsByType)) {
      try {
        const tableName = type === 'character_relationship' ? 'character_relationships' : 
                          type === 'timeline_event' ? 'timeline_events' :
                          type === 'plot_point' ? 'plot_points' :
                          type === 'plot_thread' ? 'plot_threads' :
                          'chapter_summaries';

        for (const element of typeElements) {
          const { error } = await supabase
            .from(tableName)
            .update({
              chronological_order: element.chronological_order,
              chronological_confidence: element.chronological_confidence
            })
            .eq('id', element.id);

          if (!error) {
            results[tableName as keyof typeof results]++;
          }
        }
      } catch (error) {
        console.error(`Failed to update ${type} elements:`, error);
      }
    }

    return results;
  }

  /**
   * Count unique narrative sequences
   */
  private static countNarrativeSequences(elements: NarrativeElement[]): number {
    // Group elements by narrative sequence based on dependencies
    const sequences = new Set<string>();
    
    for (const element of elements) {
      if (element.dependency_elements.length > 0) {
        const sequenceKey = element.dependency_elements.sort().join(',');
        sequences.add(sequenceKey);
      }
    }

    return sequences.size || 1; // At least one sequence
  }

  /**
   * Generate narrative sequence ID for related elements
   */
  static generateNarrativeSequenceId(): string {
    return crypto.randomUUID();
  }
}