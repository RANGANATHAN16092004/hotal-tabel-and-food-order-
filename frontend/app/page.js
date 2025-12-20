import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          Restaurant Booking System
        </h1>
        <p className="text-xl text-indigo-600 mb-8 font-medium">
          Manage your restaurant tables and orders
        </p>
        <div className="space-x-4">
          <Link
            href="/admin/login"
            className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow-lg"
          >
            Hotel Admin
          </Link>
          <Link
            href="/customer"
            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition shadow-lg"
          >
            Customer Portal
          </Link>
        </div>
      </div>
    </div>
  )
}

