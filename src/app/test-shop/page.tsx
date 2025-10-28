'use client'

import { useState, useEffect } from 'react'

export default function TestShopPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('Fetching products...')
        const response = await fetch('/api/frontend/products?page=1&limit=12')
        const data = await response.json()
        console.log('API Response:', data)
        
        if (data.success && data.data) {
          setProducts(data.data)
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Shop Page</h1>
      <p>Loading: {loading.toString()}</p>
      <p>Products count: {products.length}</p>
      
      {loading ? (
        <p>Loading products...</p>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-4">Products:</h2>
          <ul>
            {products.map((product: any) => (
              <li key={product._id} className="mb-2 p-2 border rounded">
                <strong>{product.name}</strong> - ${product.price}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
