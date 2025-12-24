'use client';

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { 
  SparklesIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface AIResponse {
  response: string;
  model: string;
  timestamp: string;
}

interface AIToolsProps {
  className?: string;
}

export default function AITools({ className = '' }: AIToolsProps) {
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const predefinedPrompts = [
    {
      title: 'Generate Executive Summary',
      icon: DocumentTextIcon,
      prompt: 'Generate a compelling executive summary for a bid proposal',
      context: { type: 'proposal' }
    },
    {
      title: 'Analyze Requirements',
      icon: ChartBarIcon,
      prompt: 'Analyze bid requirements and identify key risks and opportunities',
      context: { type: 'analysis' }
    },
    {
      title: 'Creative Ideas',
      icon: LightBulbIcon,
      prompt: 'Provide innovative approaches for this bid',
      context: { type: 'brainstorm' }
    },
    {
      title: 'Risk Assessment',
      icon: ExclamationTriangleIcon,
      prompt: 'Identify potential risks and mitigation strategies',
      context: { type: 'risk' }
    },
    {
      title: 'Competitive Analysis',
      icon: ChartBarIcon,
      prompt: 'Analyze competitive positioning and differentiation opportunities',
      context: { type: 'competition' }
    },
    {
      title: 'Pricing Strategy',
      icon: DocumentTextIcon,
      prompt: 'Recommend optimal pricing strategy and value proposition',
      context: { type: 'pricing' }
    }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError('');
    setResponse(null);

    try {
      const contextObj = context ? JSON.parse(context) : undefined;
      const result = await api.generateAIContent(prompt, contextObj);
      setResponse(result);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to generate content';
      setError(errorMessage);
      
      // Check for quota exceeded error
      if (errorMessage.includes('quota') || errorMessage.includes('429')) {
        setError('AI API quota exceeded. Please check your billing settings or try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePredefinedPrompt = (predefined: typeof predefinedPrompts[0]) => {
    setPrompt(predefined.prompt);
    setContext(JSON.stringify(predefined.context, null, 2));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-lg ${className}`}>
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-xl">
            <SparklesIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">AI Assistant</h3>
            <p className="text-sm text-gray-600">Generate intelligent content for your bids</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Predefined Prompts */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Quick Start</label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {predefinedPrompts.map((predefined) => (
              <button
                key={predefined.title}
                onClick={() => handlePredefinedPrompt(predefined)}
                className="flex items-center space-x-2 p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200"
              >
                <predefined.icon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900">{predefined.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Your Prompt *
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What would you like the AI to help you with?"
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
          />
        </div>

        {/* Context Input */}
        <div>
          <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-2">
            Context (Optional - JSON format)
          </label>
          <textarea
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder='{"bid_title": "Project Name", "customer": "Client Name"}'
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-colors duration-200"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <SparklesIcon className="h-5 w-5" />
              <span>Generate Content</span>
            </>
          )}
        </button>

        {/* Error Display */}
        {error && (
          <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Response Display */}
        {response && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <h4 className="text-lg font-semibold text-gray-900">Generated Content</h4>
              </div>
              <button
                onClick={() => copyToClipboard(response.response)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Copy to Clipboard
              </button>
            </div>
            
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                {response.response}
              </pre>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Model: {response.model}</span>
              <span>Generated: {new Date(response.timestamp).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
