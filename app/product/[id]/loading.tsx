export default function Loading() {
  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 md:px-10 py-6 md:py-10 font-sans animate-pulse">
      <div className="flex flex-col md:flex-row gap-8 md:gap-12 lg:gap-16">
        <div className="w-full md:w-[58%] aspect-[3/4] bg-gray-100 rounded-lg" />
        <div className="w-full md:w-[42%] space-y-4">
          <div className="h-4 w-1/3 bg-gray-100 rounded" />
          <div className="h-8 w-2/3 bg-gray-100 rounded" />
          <div className="h-5 w-full bg-gray-100 rounded mt-2" />
          <div className="h-6 w-1/4 bg-gray-100 rounded mt-4" />
          <div className="h-12 w-full bg-gray-100 rounded mt-6" />
          <div className="h-14 w-full bg-gray-200 rounded mt-5" />
        </div>
      </div>
    </div>
  );
}
