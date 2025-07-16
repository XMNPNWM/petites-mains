import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PenTool, BookOpen, Brain, Users } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
      <div className="container mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Petites Mains
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            L'assistant IA qui transforme vos idées en histoires captivantes. 
            Créez, organisez et développez vos projets d'écriture avec une intelligence artificielle dédiée.
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg" 
            className="text-lg px-8 py-4 hover:scale-105 transition-transform"
          >
            Commencer avec Petites Mains
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <PenTool className="h-8 w-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Écriture Assistée</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                L'IA vous aide à surmonter le syndrome de la page blanche et à développer vos idées
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Organisation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Structurez vos chapitres, personnages et intrigues dans un espace de travail unifié
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Brain className="h-8 w-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Analyse Intelligente</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                L'IA analyse votre écriture pour maintenir la cohérence et suggérer des améliorations
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Travaillez avec l'IA comme un partenaire d'écriture intelligent et créatif
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How it Works */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-8">Comment ça marche ?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto">
                1
              </div>
              <h3 className="text-xl font-semibold">Créez votre compte</h3>
              <p className="text-muted-foreground">
                Inscrivez-vous gratuitement et accédez immédiatement à votre espace d'écriture
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto">
                2
              </div>
              <h3 className="text-xl font-semibold">Commencez à écrire</h3>
              <p className="text-muted-foreground">
                Créez votre premier projet et laissez l'IA vous guider dans votre processus créatif
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto">
                3
              </div>
              <h3 className="text-xl font-semibold">Développez votre histoire</h3>
              <p className="text-muted-foreground">
                Utilisez les outils d'analyse et d'organisation pour créer des histoires cohérentes et captivantes
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-muted/30 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Prêt à transformer votre écriture ?</h2>
          <p className="text-muted-foreground mb-6">
            Rejoignez les auteurs qui utilisent déjà Petites Mains pour donner vie à leurs histoires
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg"
            className="hover:scale-105 transition-transform"
          >
            Commencer gratuitement
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;