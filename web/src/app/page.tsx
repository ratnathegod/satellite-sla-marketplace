import Link from 'next/link'
import { Header } from '@/components/Header'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Satellite Tasking Marketplace
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A decentralized marketplace for satellite tasking with verifiable SLAs. 
            Connect satellite operators with customers through smart contracts and 
            cryptographic proofs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/new-task"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Create New Task
            </Link>
            <Link
              href="/tasks"
              className="bg-white hover:bg-gray-50 text-blue-600 font-semibold py-3 px-8 rounded-lg border-2 border-blue-600 transition-colors"
            >
              Browse Tasks
            </Link>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Verifiable SLAs</h3>
            <p className="text-gray-600">
              Smart contracts ensure transparent and enforceable service level agreements
              between satellite operators and customers.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Decentralized</h3>
            <p className="text-gray-600">
              No central authority controls the marketplace. All transactions are
              peer-to-peer through blockchain technology.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Cryptographic Proofs</h3>
            <p className="text-gray-600">
              Task completion is verified through cryptographic proofs, ensuring
              trust and accountability in the system.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}