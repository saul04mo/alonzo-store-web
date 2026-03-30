export default function Loading() {
  return (
    <div className="w-full max-w-[1400px] mx-auto px-5 md:px-10 py-10 font-sans animate-pulse min-h-[60vh]">
      <div className="h-5 w-16 bg-gray-100 rounded mb-6" />
      <div className="h-8 w-48 bg-gray-100 rounded mb-10" />
      <div className="flex flex-col md:flex-row gap-10">
        <div className="flex-1 space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-6 pb-8 border-b border-gray-100">
              <div className="w-[120px] h-[160px] bg-gray-100 rounded-md shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-3 w-20 bg-gray-100 rounded" />
                <div className="h-5 w-32 bg-gray-100 rounded" />
                <div className="h-4 w-full bg-gray-100 rounded" />
                <div className="h-4 w-24 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="w-full md:w-[35%] space-y-4">
          <div className="h-6 w-24 bg-gray-100 rounded" />
          <div className="h-4 w-full bg-gray-100 rounded" />
          <div className="h-4 w-full bg-gray-100 rounded" />
          <div className="h-12 w-full bg-gray-200 rounded mt-6" />
        </div>
      </div>
    </div>
  );
}
