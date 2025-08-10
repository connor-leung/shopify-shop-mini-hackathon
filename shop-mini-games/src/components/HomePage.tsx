import { usePopularProducts, ProductCard } from '@shopify/shop-minis-react'

interface HomePageProps {
  onNavigate: (page: string) => void
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { products } = usePopularProducts()

  return (
    <div className="pt-12 px-4 pb-6">
      <h1 className="text-2xl font-bold mb-2 text-center">
        Welcome to Mini Mini Games!
      </h1>
      
      <div className="flex justify-center space-x-4 mb-6">
        <button 
          onClick={() => onNavigate('home')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Home
        </button>
        <button 
          onClick={() => onNavigate('search')}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Search Products
        </button>
        <button 
          onClick={() => onNavigate('demo')}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          Question Demo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products?.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
