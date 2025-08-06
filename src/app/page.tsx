// This root page should not be reached due to middleware redirects
// If it is reached, it means there's an issue with the middleware
export default function RootPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        <p className="text-gray-600">Redirecting to your preferred language...</p>
      </div>
    </div>
  );
}
