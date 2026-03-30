export default function Loading() {
  return (
    <div className="w-full max-w-[1400px] mx-auto px-5 md:px-10 py-8 font-sans animate-pulse min-h-[70vh]">
      <div className="h-5 w-16 bg-gray-100 rounded mb-6" />
      <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
        <div className="flex-1 lg:max-w-[60%] space-y-6">
          <div className="h-8 w-48 bg-gray-100 rounded mb-8" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-b border-gray-100 py-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <div className="h-6 w-40 bg-gray-100 rounded" />
              </div>
              <div className="h-12 w-full bg-gray-100 rounded" />
              <div className="h-12 w-full bg-gray-100 rounded" />
            </div>
          ))}
        </div>
        <div className="w-full lg:w-[38%] space-y-4">
          <div className="h-6 w-full bg-gray-100 rounded" />
          <div className="h-12 w-full bg-gray-200 rounded" />
          <div className="space-y-3 mt-6">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-16 h-20 bg-gray-100 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-100 rounded" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
