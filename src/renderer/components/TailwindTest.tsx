import React from 'react';

/**
 * Tailwind Test Component - demonstrates that Tailwind CSS v4 is working correctly
 * with the PostCSS configuration. This can be imported and used to verify
 * Tailwind classes are being processed.
 */
export const TailwindTest: React.FC = () => {
  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-lg space-y-4">
      <div className="bg-red-500 text-white p-4 rounded-lg text-center font-bold">
        ✅ TAILWIND OK - CSS Classes Working!
      </div>
      
      <div className="flex space-x-2">
        <div className="bg-blue-500 text-white p-2 rounded flex-1 text-center text-sm">
          Blue
        </div>
        <div className="bg-green-500 text-white p-2 rounded flex-1 text-center text-sm">
          Green
        </div>
        <div className="bg-yellow-500 text-white p-2 rounded flex-1 text-center text-sm">
          Yellow
        </div>
      </div>
      
      <div className="bg-primary-500 text-white p-3 rounded-lg text-center">
        Custom Primary Color (primary-500)
      </div>
      
      <div className="text-gray-600 text-sm text-center">
        If you can see styled colors and layouts above, Tailwind v4 is working correctly with PostCSS!
      </div>
    </div>
  );
};

export default TailwindTest;