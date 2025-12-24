'use client';

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { 
  CpuChipIcon, 
  PlayIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface MLTrainingResponse {
  message: string;
  models: string[];
  timestamp: string;
}

interface MLModelStatus {
  models: Array<{
    name: string;
    status: 'trained' | 'training' | 'error';
    accuracy?: number;
    last_trained?: string;
    version?: string;
  }>;
  last_training?: string;
}

export default function MLTraining() {
  const [training, setTraining] = useState(false);
  const [trainingResult, setTrainingResult] = useState<MLTrainingResponse | null>(null);
  const [modelStatus, setModelStatus] = useState<MLModelStatus | null>(null);
  const [error, setError] = useState<string>('');

  const handleTrainModels = async () => {
    setTraining(true);
    setError('');
    setTrainingResult(null);

    try {
      const result = await api.trainMLModels();
      setTrainingResult(result);
      
      // Refresh model status after training
      await fetchModelStatus();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to train models';
      setError(errorMessage);
    } finally {
      setTraining(false);
    }
  };

  const fetchModelStatus = async () => {
    try {
      const status = await api.getMLModelStatus();
      setModelStatus(status);
    } catch (err: any) {
      console.error('Failed to fetch model status:', err);
    }
  };

  const getModelIcon = (status: string) => {
    switch (status) {
      case 'trained':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'training':
        return <ClockIcon className="h-5 w-5 text-yellow-600 animate-spin" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <SparklesIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getModelStatusColor = (status: string) => {
    switch (status) {
      case 'trained':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'training':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-600 rounded-xl">
            <CpuChipIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Machine Learning Models</h3>
            <p className="text-sm text-gray-600">Train and manage ML prediction models</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Training Controls */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">Model Training</h4>
            <p className="text-sm text-gray-600 mt-1">
              Train win prediction and risk assessment models using your bid data
            </p>
          </div>
          <button
            onClick={handleTrainModels}
            disabled={training}
            className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {training ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Training...</span>
              </>
            ) : (
              <>
                <PlayIcon className="h-5 w-5" />
                <span>Train Models</span>
              </>
            )}
          </button>
        </div>

        {/* Training Result */}
        {trainingResult && (
          <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Training Successful</p>
              <p className="text-sm text-green-700 mt-1">{trainingResult.message}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {trainingResult.models.map((model) => (
                  <span
                    key={model}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-800"
                  >
                    {model}
                  </span>
                ))}
              </div>
              <p className="text-xs text-green-600 mt-2">
                Trained at: {new Date(trainingResult.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Training Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Model Status */}
        {modelStatus && (
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Model Status</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {modelStatus.models.map((model) => (
                <div
                  key={model.name}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    {getModelIcon(model.status)}
                    <div>
                      <p className="font-medium text-gray-900">{model.name}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        {model.accuracy && (
                          <span className="text-sm text-gray-600">
                            Accuracy: {(model.accuracy * 100).toFixed(1)}%
                          </span>
                        )}
                        {model.version && (
                          <span className="text-sm text-gray-600">
                            v{model.version}
                          </span>
                        )}
                        {model.last_trained && (
                          <span className="text-sm text-gray-600">
                            {new Date(model.last_trained).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${getModelStatusColor(
                      model.status
                    )}`}
                  >
                    {model.status}
                  </span>
                </div>
              ))}
            </div>

            {modelStatus.last_training && (
              <div className="mt-4 text-sm text-gray-600">
                Last training: {new Date(modelStatus.last_training).toLocaleString()}
              </div>
            )}
          </div>
        )}

        {/* Model Information */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-2">Available Models</h5>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span><strong>Win Predictor:</strong> Predicts bid win probability based on historical data</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span><strong>Risk Predictor:</strong> Assesses bid risks and potential issues</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Models are trained using your bid history, customer data, and performance metrics.
          </p>
        </div>
      </div>
    </div>
  );
}
