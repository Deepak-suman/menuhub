export default function LoadingSpinner({ fullScreen = false }) {
  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-gray-500 font-medium animate-pulse">Loading amazing food...</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return <div className="py-10 flex justify-center">{spinner}</div>;
}
