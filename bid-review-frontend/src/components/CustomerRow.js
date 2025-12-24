import React, { memo } from 'react';

const CustomerRow = memo(({ customer }) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-indigo-600 font-medium">
              {customer.name?.charAt(0)?.toUpperCase() || 'C'}
            </span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {customer.name || 'N/A'}
            </div>
            <div className="text-sm text-gray-500">
              ID: {customer.id || 'N/A'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {customer.email || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {customer.phone || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {customer.company || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          customer.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {customer.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <a href={`/customers/${customer.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">View</a>
        <a href={`/customers/${customer.id}/edit`} className="text-indigo-600 hover:text-indigo-900">Edit</a>
      </td>
    </tr>
  );
});

CustomerRow.displayName = 'CustomerRow';

export default CustomerRow;
