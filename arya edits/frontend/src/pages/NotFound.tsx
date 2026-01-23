import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: Non-existent route accessed:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_50%)]">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">

        {/* Animated Icon Container */}
        <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative glass rounded-full p-6 shadow-2xl border border-white/10">
            <AlertCircle className="w-16 h-16 text-primary" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Page Not Found
          </h1>
          <p className="text-lg text-muted-foreground">
            The coordinates <span className="font-mono bg-muted px-2 py-0.5 rounded text-primary">{location.pathname}</span> do not exist in this sector.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/dashboard">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 rounded-xl h-12 px-8">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Mission Control
            </Button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground/50 pt-8">
          Error Code: 404_ORBIT_LOST
        </p>
      </div>
    </div>
  );
};

export default NotFound;
