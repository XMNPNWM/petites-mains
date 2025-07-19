
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PenTool, BookOpen, Brain, Users, Zap, FileText, Sparkles, ArrowRight, CheckCircle, Globe, Edit3, BarChart3 } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  const handleLearnMore = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/lovable-uploads/e2abb4f3-f724-4125-bd0c-00a3f6a12763.png')`,
          }}
        >
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 text-center text-white">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Libérez Votre
            <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Chef-d'Œuvre
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed text-gray-200">
            Votre co-auteur IA pour une créativité sans limites. 
            De l'idée au livre publié, transformez votre processus d'écriture.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={handleGetStarted}
              size="lg" 
              className="text-lg px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
            >
              Commencer à Écrire Gratuitement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              onClick={handleLearnMore}
              variant="outline"
              size="lg"
              className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-gray-900 transition-all duration-200"
            >
              En Savoir Plus
            </Button>
          </div>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Pourquoi Les Auteurs Choisissent Petites Mains ?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Nous comprenons les défis que vous rencontrez dans votre parcours d'écriture.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-destructive mb-4">Les Défis Communs :</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-muted-foreground">Le syndrome de la page blanche qui bloque votre créativité</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-muted-foreground">L'édition fastidieuse qui consume votre temps précieux</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-muted-foreground">La désorganisation de vos idées et personnages</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-muted-foreground">Le formatage complexe pour la publication</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-primary mb-4">Notre Solution :</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <p className="text-foreground">IA créative qui génère des idées et débloquer votre inspiration</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <p className="text-foreground">Corrections et suggestions automatiques pour un style parfait</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <p className="text-foreground">Organisation intelligente de votre univers narratif</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <p className="text-foreground">Export professionnel prêt pour publication en un clic</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Comment Ça Marche ?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Des outils puissants conçus spécifiquement pour les auteurs modernes
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader>
                <Edit3 className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle className="text-xl">Espace d'Écriture</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Un environnement sans distraction pour libérer votre créativité et organiser vos pensées
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader>
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle className="text-xl">IA Créative</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Suggestions intelligentes, corrections de style et génération d'idées pour enrichir votre récit
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader>
                <Globe className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle className="text-xl">Univers Narratif</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Construisez des mondes riches et cohérents avec un système d'organisation avancé
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader>
                <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle className="text-xl">Export Professionnel</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Exportez vos manuscrits dans des formats prêts pour publication en quelques clics
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ce Que Disent Nos Auteurs
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4 italic">
                  "Petites Mains a révolutionné mon processus d'écriture. L'IA comprend vraiment le style que je recherche."
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                    M
                  </div>
                  <div>
                    <p className="font-semibold">Marie Dubois</p>
                    <p className="text-sm text-muted-foreground">Romancière</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4 italic">
                  "En tant qu'auteur indépendant, l'export professionnel m'a fait gagner des heures de formatage."
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                    P
                  </div>
                  <div>
                    <p className="font-semibold">Pierre Martin</p>
                    <p className="text-sm text-muted-foreground">Auteur Indépendant</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4 italic">
                  "L'organisation de mes personnages n'a jamais été aussi simple. Un outil indispensable !"
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                    S
                  </div>
                  <div>
                    <p className="font-semibold">Sophie Leroy</p>
                    <p className="text-sm text-muted-foreground">Autrice Fantasy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Secondary CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Prêt à Écrire Votre Meilleure Histoire ?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Rejoignez les auteurs qui transforment déjà leur créativité avec Petites Mains
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg"
            variant="secondary"
            className="text-lg px-8 py-4 hover:scale-105 transition-transform"
          >
            Commencer Maintenant - C'est Gratuit
            <Zap className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Questions Fréquentes
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-left">Est-ce que Petites Mains est gratuit ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Oui ! Vous pouvez commencer à utiliser Petites Mains gratuitement avec toutes les fonctionnalités de base. Des plans premium sont disponibles pour des besoins avancés.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-left">Mes données sont-elles sécurisées ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Absolument. Vos écrits sont chiffrés et stockés de manière sécurisée. Nous ne partageons jamais vos créations avec des tiers.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-left">L'IA va-t-elle écrire à ma place ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Non, l'IA est là pour vous assister, pas pour remplacer votre créativité. Elle suggère, corrige et inspire, mais vous gardez toujours le contrôle total de votre histoire.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-left">Puis-je exporter mes textes ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Oui, vous pouvez exporter vos manuscrits dans plusieurs formats professionnels (PDF, DOCX, EPUB) prêts pour la publication ou l'impression.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Petites Mains</h3>
              <p className="text-sm text-muted-foreground">
                L'assistant IA qui transforme vos idées en histoires captivantes.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Produit</h4>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground cursor-pointer hover:text-foreground">Fonctionnalités</p>
                <p className="text-muted-foreground cursor-pointer hover:text-foreground">Tarifs</p>
                <p className="text-muted-foreground cursor-pointer hover:text-foreground">Guide d'utilisation</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Support</h4>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground cursor-pointer hover:text-foreground">Centre d'aide</p>
                <p className="text-muted-foreground cursor-pointer hover:text-foreground">Contact</p>
                <p className="text-muted-foreground cursor-pointer hover:text-foreground">Communauté</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Légal</h4>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground cursor-pointer hover:text-foreground">Confidentialité</p>
                <p className="text-muted-foreground cursor-pointer hover:text-foreground">Conditions d'utilisation</p>
                <p className="text-muted-foreground cursor-pointer hover:text-foreground">Mentions légales</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-muted-foreground/20 mt-8 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 Petites Mains. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
