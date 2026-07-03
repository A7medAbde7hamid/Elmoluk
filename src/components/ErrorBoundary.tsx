import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">حدث خطأ غير متوقع</h1>
            <p className="text-gray-400 mb-6">نأسف للإزعاج، يرجى تحديث الصفحة والمحاولة مرة أخرى</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-colors"
            >
              تحديث الصفحة
            </button>
            <p className="text-gray-600 text-xs mt-4">
              {this.state.error?.message}
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
