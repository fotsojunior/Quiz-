import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Quiz boundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0B1120] p-6 text-center text-slate-100">
          <div className="max-w-md rounded-xl border border-white/10 bg-[#121B2E] p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400 font-display text-2xl font-black text-slate-950">
              ?
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold text-white">
              Une erreur est survenue
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Votre progression et les points de votre pays sont sauvegardés. Cliquez ci-dessous pour reprendre instantanément.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="mt-6 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-amber-300 transition-colors"
            >
              Reprendre la partie
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
