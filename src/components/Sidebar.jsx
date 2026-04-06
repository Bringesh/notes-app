export default function Sidebar() {
  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col">
      <h1 className="text-xl font-bold mb-6">My Notes</h1>
      <div className="flex-1">
        <p className="text-sm text-gray-500 mb-2">Semesters</p>
        <ul className="space-y-2">
          <li className="p-2 bg-gray-100 dark:bg-gray-700 rounded cursor-pointer">Semester 4</li>
        </ul>
      </div>
    </div>
  );
}