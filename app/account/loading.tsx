export default function Loading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-12 md:py-20 font-sans animate-pulse min-h-[70vh]">
      <div className="h-8 w-72 bg-gray-100 rounded mb-14" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[220px] border border-gray-100 p-10 space-y-4">
            <div className="h-5 w-40 bg-gray-100 rounded" />
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-4 w-2/3 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
