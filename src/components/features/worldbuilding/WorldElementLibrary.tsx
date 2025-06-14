
import React, { useState } from 'react';
import { Plus, Search, Filter, Users, MapPin, Scroll, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ElementCard from './ElementCard';
import ElementForm from './ElementForm';

const WorldElementLibrary = () => {
  const [activeTab, setActiveTab] = useState('characters');
  const [showForm, setShowForm] = useState(false);

  const tabs = [
    { id: 'characters', label: 'Characters', icon: Users, count: 12 },
    { id: 'locations', label: 'Locations', icon: MapPin, count: 8 },
    { id: 'lore', label: 'Lore & History', icon: Scroll, count: 15 },
    { id: 'organizations', label: 'Organizations', icon: Crown, count: 5 }
  ];

  const elements = {
    characters: [
      {
        id: 1,
        name: 'Aria Shadowmere',
        type: 'Protagonist',
        description: 'A skilled assassin turned reluctant hero with the power to manipulate shadows.',
        tags: ['Main Character', 'Magic User', 'Assassin'],
        image: '/placeholder.svg'
      },
      {
        id: 2,
        name: 'Lord Blackthorne',
        type: 'Antagonist',
        description: 'A powerful necromancer seeking to overthrow the kingdom and rule the undead.',
        tags: ['Villain', 'Necromancer', 'Noble'],
        image: '/placeholder.svg'
      },
      {
        id: 3,
        name: 'Finn the Brave',
        type: 'Supporting',
        description: 'A loyal knight and childhood friend of the protagonist.',
        tags: ['Knight', 'Loyal', 'Childhood Friend'],
        image: '/placeholder.svg'
      }
    ],
    locations: [
      {
        id: 1,
        name: 'The Whispering Woods',
        type: 'Forest',
        description: 'An ancient forest where the trees are said to hold the memories of the past.',
        tags: ['Magical', 'Ancient', 'Mysterious'],
        image: '/placeholder.svg'
      },
      {
        id: 2,
        name: 'Shadowmere Castle',
        type: 'Castle',
        description: 'The ancestral home of the Shadowmere family, built on a cliff overlooking the sea.',
        tags: ['Noble House', 'Fortress', 'Coastal'],
        image: '/placeholder.svg'
      }
    ],
    lore: [
      {
        id: 1,
        name: 'The Great Sundering',
        type: 'Historical Event',
        description: 'A cataclysmic event that split the realm into multiple dimensions.',
        tags: ['Ancient History', 'Magical Event', 'World-changing'],
        image: '/placeholder.svg'
      }
    ],
    organizations: [
      {
        id: 1,
        name: 'The Shadow Guild',
        type: 'Secret Society',
        description: 'A clandestine organization of assassins and spies.',
        tags: ['Secret', 'Assassins', 'Underground'],
        image: '/placeholder.svg'
      }
    ]
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">World Library</h1>
          <p className="text-slate-600">Build and organize your story's world elements</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Element
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input placeholder="Search characters, locations, lore..." className="pl-10" />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {elements[activeTab as keyof typeof elements]?.map((element) => (
          <ElementCard key={element.id} element={element} />
        ))}
      </div>

      {/* Add Element Form Modal */}
      {showForm && (
        <ElementForm 
          isOpen={showForm} 
          onClose={() => setShowForm(false)}
          elementType={activeTab}
        />
      )}
    </div>
  );
};

export default WorldElementLibrary;
