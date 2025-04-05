'use client';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

export default function FlexibleTable({ data = [], columns = [], defaultSort }) {
  const [sortBy, setSortBy] = useState(defaultSort?.key || null);
  const [sortDir, setSortDir] = useState(defaultSort?.direction || 'asc');

  useEffect(() => {
    if (defaultSort) {
      setSortBy(defaultSort.key);
      setSortDir(defaultSort.direction);
    }
  }, [defaultSort]);

  if (!data.length) return <p className="text-gray-400">No data</p>;
  if (!columns.length) return <p className="text-rose-500">No columns defined</p>;

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const sortedData = sortBy
    ? [...data].sort((a, b) => {
        const valA = a[sortBy];
        const valB = b[sortBy];
        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      })
    : data;

  const getTextAlignClass = (align) => {
    if (align === 'center') return 'text-center';
    if (align === 'right') return 'text-right';
    return 'text-left';
  };

  return (
    <div className="overflow-x-auto rounded">
      <table className="min-w-full border border-emerald-700">
        <thead className="bg-emerald-800 text-gray-100 uppercase">
          <tr>
            {columns.map(({ key, label, align }) => (
              <th
                key={key}
                onClick={() => handleSort(key)}
                className={`px-4 py-3 ${getTextAlignClass(align)} cursor-pointer select-none hover:bg-emerald-700 transition text-`}
              >
                {label}
                {sortBy === key && (
                  <span className="ml-1">{sortDir === 'asc' ? 
                  <ArrowUpIcon className='w-4 h-4 mt-1 float-right'/> : 
                  <ArrowDownIcon className='w-4 h-4 mt-1 float-right'/>
                }</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-emerald-900">
          {sortedData.map((row, idx) => (
            <tr
              key={idx}
              className="border-t border-emerald-600 odd:bg-emerald-700 even:bg-emerald-600 hover:bg-emerald-800"
            >
              {columns.map(({ key, render, align }) => (
                <td key={key} className={`px-4 py-2 ${getTextAlignClass(align)}`}>
                  {render ? render(row) : row[key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
