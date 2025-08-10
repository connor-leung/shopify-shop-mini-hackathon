import { useState } from 'react'
import { HomePage } from './components/HomePage'
import { SearchPage } from './search/searchPage'
import QuestionDemo from './components/QuestionDemo'

export function App() {
  const [currentPage, setCurrentPage] = useState('home')
  
  // Handle routing based on current page state
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={setCurrentPage} />
      case 'search':
        return <SearchPage onNavigate={setCurrentPage} />
      case 'demo':
        return <QuestionDemo onNavigate={setCurrentPage} />
      default:
        return <HomePage onNavigate={setCurrentPage} />
    }
  }
  
  return renderPage()
}