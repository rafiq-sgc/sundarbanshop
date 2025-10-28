'use client'

import { useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Truck,
  DollarSign,
  Globe,
  Package,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

interface ShippingZone {
  _id: string
  name: string
  countries: string[]
  states?: string[]
  shippingMethods: {
    name: string
    rate: number
    estimatedDays: string
    isActive: boolean
  }[]
  isActive: boolean
  createdAt: string
}

export default function ShippingZonesPage() {
  const [zones, setZones] = useState<ShippingZone[]>([
    {
      _id: '1',
      name: 'United States (Domestic)',
      countries: ['United States'],
      shippingMethods: [
        { name: 'Standard Shipping', rate: 5.99, estimatedDays: '5-7', isActive: true },
        { name: 'Express Shipping', rate: 15.99, estimatedDays: '2-3', isActive: true },
        { name: 'Next Day', rate: 25.99, estimatedDays: '1', isActive: true }
      ],
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      _id: '2',
      name: 'Europe Zone',
      countries: ['United Kingdom', 'Germany', 'France', 'Italy', 'Spain'],
      shippingMethods: [
        { name: 'Standard International', rate: 12.99, estimatedDays: '10-15', isActive: true },
        { name: 'Express International', rate: 29.99, estimatedDays: '5-7', isActive: true }
      ],
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      _id: '3',
      name: 'Asia-Pacific',
      countries: ['Australia', 'Japan', 'Singapore', 'South Korea', 'China'],
      shippingMethods: [
        { name: 'Standard International', rate: 15.99, estimatedDays: '12-20', isActive: true },
        { name: 'Express International', rate: 35.99, estimatedDays: '7-10', isActive: true }
      ],
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      _id: '4',
      name: 'Canada',
      countries: ['Canada'],
      shippingMethods: [
        { name: 'Standard Cross-Border', rate: 8.99, estimatedDays: '7-10', isActive: true },
        { name: 'Express Cross-Border', rate: 19.99, estimatedDays: '3-5', isActive: true }
      ],
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    }
  ])

  const stats = {
    totalZones: zones.length,
    activeZones: zones.filter(z => z.isActive).length,
    totalCountries: zones.reduce((sum, z) => sum + z.countries.length, 0),
    avgShippingRate: zones.reduce((sum, z) => 
      sum + z.shippingMethods.reduce((s, m) => s + m.rate, 0) / z.shippingMethods.length, 0
    ) / zones.length
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/settings/shipping"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shipping Settings
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Shipping Zones</h1>
              <p className="text-gray-600 mt-2">
                Configure shipping zones and rates for different regions
              </p>
            </div>
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Add Zone
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Zones</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalZones}</p>
            <p className="text-xs text-green-600 mt-2">{stats.activeZones} active</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Globe className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Countries Covered</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalCountries}</p>
            <p className="text-xs text-gray-500 mt-2">Worldwide shipping</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Truck className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Shipping Methods</p>
            <p className="text-3xl font-bold text-gray-900">
              {zones.reduce((sum, z) => sum + z.shippingMethods.length, 0)}
            </p>
            <p className="text-xs text-gray-500 mt-2">Total options</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Avg. Shipping Rate</p>
            <p className="text-3xl font-bold text-gray-900">${stats.avgShippingRate.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-2">Per zone</p>
          </div>
        </div>

        {/* Shipping Zones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {zones.map((zone) => (
            <div
              key={zone._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              {/* Zone Header */}
              <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg mr-3">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{zone.name}</h3>
                    <p className="text-sm text-gray-500">
                      {zone.countries.length} {zone.countries.length === 1 ? 'country' : 'countries'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      zone.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {zone.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Countries */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Countries</p>
                <div className="flex flex-wrap gap-2">
                  {zone.countries.map((country, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {country}
                    </span>
                  ))}
                </div>
              </div>

              {/* Shipping Methods */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-3">
                  Shipping Methods
                </p>
                <div className="space-y-3">
                  {zone.shippingMethods.map((method, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <Truck className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{method.name}</p>
                          <p className="text-xs text-gray-500">{method.estimatedDays} days</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          ${method.rate.toFixed(2)}
                        </p>
                        <span
                          className={`text-xs ${
                            method.isActive ? 'text-green-600' : 'text-gray-500'
                          }`}
                        >
                          {method.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                <button className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center justify-center">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Zone
                </button>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Zone Placeholder */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-dashed border-blue-300 rounded-xl p-8 text-center">
          <MapPin className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Add More Shipping Zones</h3>
          <p className="text-gray-600 mb-4">
            Expand your reach by adding shipping zones for more countries
          </p>
          <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
            <Plus className="w-5 h-5 inline mr-2" />
            Create New Zone
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}

