import { Routes, Route } from 'react-router-dom'
import { HomePage } from './components/HomePage'
import { SearchPage } from './search/searchPage'
import QuestionDemo from './components/QuestionDemo'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/demo" element={<QuestionDemo />} />
    </Routes>
  )
}