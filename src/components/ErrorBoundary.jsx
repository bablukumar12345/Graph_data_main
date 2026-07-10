import React, { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="runtime-error">
          <h1>App error</h1>
          <p>{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('noida_decor_current_draft_v3');
              window.location.reload();
            }}
          >
            Reset draft and reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
