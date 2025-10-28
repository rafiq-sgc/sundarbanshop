'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  FileText,
  Database
} from 'lucide-react'
import Link from 'next/link'

export default function ImportExportPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importResults, setImportResults] = useState<any>(null)
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('csv')
  const [exportOptions, setExportOptions] = useState({
    includeImages: true,
    includeVariants: true,
    includeInventory: true,
    includeCategories: true,
    includePricing: true
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0])
    }
  }

  const handleImport = async () => {
    if (!importFile) return

    setImporting(true)
    setImportResults(null)

    try {
      const formData = new FormData()
      formData.append('file', importFile)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mock results
      setImportResults({
        success: true,
        totalRows: 150,
        imported: 145,
        skipped: 3,
        errors: 2,
        details: [
          { row: 15, error: 'Invalid SKU format', product: 'Product ABC' },
          { row: 78, error: 'Missing required field: price', product: 'Product XYZ' }
        ]
      })
    } catch (error) {
      console.error('Import error:', error)
    } finally {
      setImporting(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Create mock CSV content
      const csvContent = `SKU,Name,Description,Price,Stock,Category
SKU001,Product 1,Description 1,29.99,100,Category A
SKU002,Product 2,Description 2,39.99,50,Category B`

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `products_export_${Date.now()}.${exportFormat}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setExporting(false)
    }
  }

  const downloadTemplate = () => {
    const template = `SKU,Name,Description,Price,Compare Price,Cost,Stock,Category,Tags,Images,Status
SKU001,Sample Product,Product description here,29.99,39.99,15.00,100,Electronics,tag1;tag2,image1.jpg;image2.jpg,active
SKU002,Another Product,Another description,49.99,,,50,Clothing,tag3,image3.jpg,active`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'product_import_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/products"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Import/Export</h1>
          <p className="text-gray-600 mt-2">
            Import or export products in bulk using CSV or Excel files
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('import')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'import'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Import Products
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'export'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Download className="w-4 h-4 inline mr-2" />
              Export Products
            </button>
          </nav>
        </div>

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Import Instructions
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Download the template file to see the required format</li>
                <li>• Supported formats: CSV (.csv), Excel (.xlsx)</li>
                <li>• Required fields: SKU, Name, Price, Stock</li>
                <li>• Images: Use semicolon (;) to separate multiple image URLs</li>
                <li>• Tags: Use semicolon (;) to separate multiple tags</li>
                <li>• Maximum file size: 10MB</li>
              </ul>
              <button
                onClick={downloadTemplate}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Download Template
              </button>
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Upload File</h3>

              {/* File Drop Zone */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary-500 transition-colors">
                <FileSpreadsheet className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drop your file here or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Supports CSV and XLSX files up to 10MB
                </p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer transition-colors"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Select File
                </label>
              </div>

              {/* Selected File */}
              {importFile && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-8 h-8 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{importFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(importFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setImportFile(null)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Import Button */}
              <button
                onClick={handleImport}
                disabled={!importFile || importing}
                className="mt-6 w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center"
              >
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Database className="w-5 h-5 mr-2" />
                    Start Import
                  </>
                )}
              </button>
            </div>

            {/* Import Results */}
            {importResults && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  {importResults.success ? (
                    <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 mr-2" />
                  )}
                  Import Results
                </h3>

                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Total Rows</p>
                    <p className="text-2xl font-bold text-gray-900">{importResults.totalRows}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Imported</p>
                    <p className="text-2xl font-bold text-green-600">{importResults.imported}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Skipped</p>
                    <p className="text-2xl font-bold text-yellow-600">{importResults.skipped}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Errors</p>
                    <p className="text-2xl font-bold text-red-600">{importResults.errors}</p>
                  </div>
                </div>

                {importResults.details && importResults.details.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Error Details</h4>
                    <div className="space-y-2">
                      {importResults.details.map((detail: any, index: number) => (
                        <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium text-red-900">
                            Row {detail.row}: {detail.product}
                          </p>
                          <p className="text-sm text-red-700">{detail.error}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Export Settings</h3>

              {/* Format Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Export Format
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setExportFormat('csv')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      exportFormat === 'csv'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                    <p className="font-semibold text-gray-900">CSV</p>
                    <p className="text-xs text-gray-500">Comma-separated values</p>
                  </button>
                  <button
                    onClick={() => setExportFormat('xlsx')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      exportFormat === 'xlsx'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="font-semibold text-gray-900">Excel</p>
                    <p className="text-xs text-gray-500">Microsoft Excel format</p>
                  </button>
                </div>
              </div>

              {/* Export Options */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Include Data
                </label>
                <div className="space-y-3">
                  {Object.entries(exportOptions).map(([key, value]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) =>
                          setExportOptions({ ...exportOptions, [key]: e.target.checked })
                        }
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-3 text-sm text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Export Button */}
              <button
                onClick={handleExport}
                disabled={exporting}
                className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center"
              >
                {exporting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Export Products
                  </>
                )}
              </button>
            </div>

            {/* Export Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Export Information</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• CSV files can be opened in Excel, Google Sheets, or any text editor</li>
                <li>• Excel files preserve formatting and support multiple sheets</li>
                <li>• Exported files include all visible products and their data</li>
                <li>• Use filters before exporting to export specific products</li>
                <li>• Image URLs are exported, not the actual image files</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

