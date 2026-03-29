import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-zinc-950 text-white font-sans">
          <div className="bento-item max-w-md w-full p-8 border-red-500/20 bg-red-500/5 space-y-6 text-center shadow-2xl shadow-red-500/10">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tight">Ocorreu um erro inesperado</h2>
              <p className="text-zinc-400 text-sm">
                A interface do ClientFlow encontrou uma instabilidade. Não se preocupe, seus dados estão seguros.
              </p>
            </div>
            <div className="pt-4">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full rounded-2xl py-6 premium-gradient text-white font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2"
              >
                <RefreshCcw className="h-4 w-4" /> Recarregar Aplicação
              </Button>
            </div>
            {this.state.error && (
              <p className="text-[10px] text-red-500/50 uppercase font-mono break-all">
                Error Log: {this.state.error.message}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
