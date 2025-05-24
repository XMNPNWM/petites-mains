
import React, { useState } from 'react';
import { Plus, Move, Trash2, Edit3, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const MindmapCanvas = () => {
  const [nodes] = useState([
    {
      id: 1,
      title: 'Main Story',
      x: 400,
      y: 200,
      type: 'central',
      color: 'from-purple-500 to-blue-500'
    },
    {
      id: 2,
      title: 'Aria\'s Journey',
      x: 200,
      y: 100,
      type: 'branch',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 3,
      title: 'World Building',
      x: 600,
      y: 100,
      type: 'branch',
      color: 'from-amber-500 to-orange-500'
    },
    {
      id: 4,
      title: 'Character Arcs',
      x: 200,
      y: 300,
      type: 'branch',
      color: 'from-pink-500 to-rose-500'
    },
    {
      id: 5,
      title: 'Plot Twists',
      x: 600,
      y: 300,
      type: 'branch',
      color: 'from-cyan-500 to-blue-500'
    },
    {
      id: 6,
      title: 'Shadow Powers',
      x: 100,
      y: 50,
      type: 'leaf',
      color: 'from-gray-600 to-slate-600'
    },
    {
      id: 7,
      title: 'Assassin Training',
      x: 100,
      y: 150,
      type: 'leaf',
      color: 'from-red-500 to-pink-500'
    }
  ]);

  const connections = [
    { from: 1, to: 2 },
    { from: 1, to: 3 },
    { from: 1, to: 4 },
    { from: 1, to: 5 },
    { from: 2, to: 6 },
    { from: 2, to: 7 }
  ];

  return (
    <div className="p-6 h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Story Mind Map</h1>
          <p className="text-slate-600">Visualize your story structure and connections</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Maximize className="w-4 h-4" />
          </Button>
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Node
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <Card className="h-[calc(100vh-200px)]">
        <CardContent className="p-0 h-full relative overflow-hidden bg-slate-50">
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
            {/* Connections */}
            {connections.map((connection, index) => {
              const fromNode = nodes.find(n => n.id === connection.from);
              const toNode = nodes.find(n => n.id === connection.to);
              if (!fromNode || !toNode) return null;
              
              return (
                <line
                  key={index}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke="rgba(148, 163, 184, 0.5)"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => (
            <div
              key={node.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              style={{ 
                left: node.x, 
                top: node.y,
                zIndex: 2
              }}
            >
              <div className={`
                bg-gradient-to-r ${node.color} 
                rounded-lg p-4 shadow-lg min-w-32 text-center
                group-hover:shadow-xl transition-all duration-200
                ${node.type === 'central' ? 'scale-110' : ''}
                ${node.type === 'leaf' ? 'scale-90' : ''}
              `}>
                <h3 className={`font-medium text-white ${
                  node.type === 'central' ? 'text-lg' : 'text-sm'
                }`}>
                  {node.title}
                </h3>
                
                {/* Node Actions */}
                <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex space-x-1">
                    <Button size="icon" variant="secondary" className="h-6 w-6">
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="secondary" className="h-6 w-6">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-30" style={{ zIndex: 0 }}>
            <svg width="100%" height="100%">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Mini Toolbar */}
      <div className="flex items-center justify-center mt-4 space-x-2">
        <Button variant="outline" size="sm">
          <Move className="w-4 h-4 mr-2" />
          Pan Mode
        </Button>
        <Button variant="outline" size="sm">
          Auto Layout
        </Button>
        <Button variant="outline" size="sm">
          Export PNG
        </Button>
      </div>
    </div>
  );
};

export default MindmapCanvas;
