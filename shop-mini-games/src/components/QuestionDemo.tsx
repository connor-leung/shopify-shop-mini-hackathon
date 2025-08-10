import React, { useState } from 'react';
import { 
  useGenerateQuestion, 
  useGenerateRandomQuestion, 
  useGenerateQuestionWithMultipleSearches,
  getRandomQuestionPreview,
  Difficulty 
} from '../utils/generateQuestions';

interface QuestionDemoProps {
  onNavigate: (page: string) => void
}

const QuestionDemo: React.FC<QuestionDemoProps> = ({ onNavigate }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">
        Question Generation Demo
      </h1>
      
      {/* Navigation */}
      <div className="flex justify-center mb-6">
        <button 
          onClick={() => onNavigate('home')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          ← Back to Home
        </button>
      </div>
      
      {/* Refresh Button */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center">
        <h2 className="text-xl font-semibold mb-4">Generate New Questions</h2>
        <button
          onClick={handleRefresh}
          className="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-lg"
        >
          🔄 Generate All Difficulties
        </button>
        <p className="text-gray-600 mt-2">This will generate 1 question from each difficulty level</p>
      </div>

      {/* Demo Sections - One for each difficulty */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Easy Question */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-green-200">
          <h3 className="text-lg font-semibold mb-4 text-green-600">
            🟢 Easy Difficulty
          </h3>
          <QuestionDisplay 
            key={`easy-${refreshKey}`}
            difficulty="Easy"
            useHook={() => useGenerateQuestion("Easy")}
            title="Easy Question"
          />
        </div>

        {/* Medium Question */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-yellow-200">
          <h3 className="text-lg font-semibold mb-4 text-yellow-600">
            🟡 Medium Difficulty
          </h3>
          <QuestionDisplay 
            key={`medium-${refreshKey}`}
            difficulty="Medium"
            useHook={() => useGenerateQuestion("Medium")}
            title="Medium Question"
          />
        </div>

        {/* Hard Question */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-orange-200">
          <h3 className="text-lg font-semibold mb-4 text-orange-600">
            🟠 Hard Difficulty
          </h3>
          <QuestionDisplay 
            key={`hard-${refreshKey}`}
            difficulty="Hard"
            useHook={() => useGenerateQuestion("Hard")}
            title="Hard Question"
          />
        </div>

        {/* Expert Question */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-red-200">
          <h3 className="text-lg font-semibold mb-4 text-red-600">
            🔴 Expert Difficulty
          </h3>
          <QuestionDisplay 
            key={`expert-${refreshKey}`}
            difficulty="Expert"
            useHook={() => useGenerateQuestion("Expert")}
            title="Expert Question"
          />
        </div>
      </div>

      {/* Additional Demo Sections */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Random Question */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-purple-200">
          <h3 className="text-lg font-semibold mb-4 text-purple-600">
            🎲 Random Difficulty Question
          </h3>
          <QuestionDisplay 
            key={`random-${refreshKey}`}
            difficulty="Random"
            useHook={() => useGenerateRandomQuestion()}
            title="Random Difficulty"
          />
        </div>

        {/* Question Preview */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-teal-200">
          <h3 className="text-lg font-semibold mb-4 text-teal-600">
            📋 Question Structure Preview
          </h3>
          <QuestionPreview key={`preview-${refreshKey}`} />
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">How to Use</h2>
        <ul className="list-disc list-inside space-y-2 text-blue-700">
          <li>Click "Generate All Difficulties" to refresh all sections with new random questions</li>
          <li>Each difficulty level (Easy, Medium, Hard, Expert) will show one unique question</li>
          <li>Compare how different difficulties use different search terms and categories</li>
          <li>The "Random" section shows a question with random difficulty for comparison</li>
          <li>The "Preview" section shows question structure without product data</li>
          <li>All sections update together when you refresh</li>
        </ul>
      </div>
    </div>
  );
};

// Component to display question data
const QuestionDisplay: React.FC<{
  difficulty: Difficulty | 'Random';
  useHook: () => any;
  title: string;
}> = ({ difficulty, useHook, title }) => {
  const questionData = useHook();

  if (questionData.loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (questionData.error) {
    return (
      <div className="text-red-600 p-3 bg-red-50 rounded">
        Error: {questionData.error.message || 'Failed to load question'}
      </div>
    );
  }

  return (
    <div>
      <h4 className="font-medium text-gray-700 mb-3">{title}</h4>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-600">Difficulty:</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
            {questionData.difficulty}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-600">Category:</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
            {questionData.category}
          </span>
        </div>
        
        <div>
          <span className="font-medium text-gray-600">Search Terms:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {questionData.searchTerms?.map((term: string, index: number) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                {term}
              </span>
            ))}
          </div>
        </div>
        
        <div>
          <span className="font-medium text-gray-600">Products Found:</span>
          <div className="text-sm text-gray-500 mt-1">
            {questionData.items?.length || 0} products
          </div>
        </div>
        
        {questionData.items && questionData.items.length > 0 && (
          <div>
            <span className="font-medium text-gray-600">Product Details:</span>
            <div className="mt-2 space-y-2">
              {questionData.items.map((item: any, index: number) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                  <div className="font-medium">ID: {item.id}</div>
                  <div className="text-gray-600 truncate">
                    {item.product?.title || 'No title'} - ${item.product?.priceRange?.minVariantPrice?.amount || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Component to show question preview without products
const QuestionPreview: React.FC = () => {
  const difficulties: Difficulty[] = ["Easy", "Medium", "Hard", "Expert"];
  const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
  const preview = getRandomQuestionPreview(randomDifficulty);

  return (
    <div>
      <h4 className="font-medium text-gray-700 mb-3">Random Question Structure</h4>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-600">Difficulty:</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
            {preview.difficulty}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-600">Category:</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
            {preview.category}
          </span>
        </div>
        
        <div>
          <span className="font-medium text-gray-600">Search Terms:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {preview.searchTerms.map((term: string, index: number) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                {term}
              </span>
            ))}
          </div>
        </div>
        
        <div className="text-xs text-gray-500 mt-2 p-2 bg-yellow-50 rounded">
          This preview shows the question structure without product data. 
          Use the other sections to see actual product results.
        </div>
      </div>
    </div>
  );
};

export default QuestionDemo;
