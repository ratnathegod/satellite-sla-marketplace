import { Header } from '@/components/Header'

interface TaskPageProps {
  params: {
    id: string
  }
}

export default function TaskPage({ params }: TaskPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Task #{params.id}
                </h1>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    Pending
                  </span>
                  <span className="text-gray-600">Created 2 hours ago</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">0.1 ETH</div>
                <div className="text-sm text-gray-600">Budget</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">Task Details</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-700">Title</h3>
                    <p className="text-gray-900">High-resolution imaging of agricultural area</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-700">Description</h3>
                    <p className="text-gray-900">
                      Capture high-resolution satellite imagery of a 10km² agricultural area 
                      for crop monitoring and yield estimation. Images should be captured 
                      during daylight hours with minimal cloud cover.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-700">Location</h3>
                    <p className="text-gray-900">40.7128°N, -74.0060°W</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-700">Deadline</h3>
                    <p className="text-gray-900">December 31, 2024 at 11:59 PM</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Contract Information</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-700">Contract Address</h3>
                    <p className="text-gray-900 font-mono text-sm break-all">
                      0x1234567890123456789012345678901234567890
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-700">Customer</h3>
                    <p className="text-gray-900 font-mono text-sm break-all">
                      0xabcdefabcdefabcdefabcdefabcdefabcdefabcd
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-700">Escrow Status</h3>
                    <p className="text-gray-900">Funded</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                    Accept Task
                  </button>
                  <button className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors">
                    View on Explorer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}