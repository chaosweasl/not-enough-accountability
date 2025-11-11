import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
          <Card className="max-w-2xl w-full border-2 border-destructive/20">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-destructive">
                    Something went wrong
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    The application encountered an unexpected error
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm font-mono text-destructive">
                  {this.state.error?.toString()}
                </p>
              </div>

              {process.env.NODE_ENV === "development" && this.state.errorInfo && (
                <details className="space-y-2">
                  <summary className="cursor-pointer text-sm font-semibold text-muted-foreground hover:text-foreground">
                    Stack Trace (Development Only)
                  </summary>
                  <pre className="mt-2 p-3 rounded-lg bg-muted text-xs overflow-auto max-h-64 border">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={this.handleReset}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  className="flex-1 bg-gradient-to-r from-primary to-accent"
                >
                  Reload Application
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-4">
                If this problem persists, please restart the application
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
