
import React from 'react';
import { Status } from '../types';

interface StatusSelectorProps {
  status: Status;
  onChange: (newStatus: Status) => void;
}

const StatusSelector: React.FC<StatusSelectorProps> = ({ status, onChange }) => {
  const getNextStatus = (current: Status): Status => {
    switch (current) {
      case 'PENDING': return 'DONE';
      case 'DONE': return 'NOT_DONE';
      case 'NOT_DONE': return 'NA';
      case 'NA': return 'PENDING';
      default: return 'PENDING';
    }
  };

  const getStyle = (s: Status) => {
    switch (s) {
      case 'DONE': return 'bg-green-100 text-green-700 border-green-200';
      case 'NOT_DONE': return 'bg-red-100 text-red-700 border-red-200';
      case 'NA': return 'bg-gray-200 text-gray-500 border-gray-300';
      default: return 'bg-white text-gray-300 border-gray-200';
    }
  };

  const getIcon = (s: Status) => {
    switch (s) {
      case 'DONE': return '✓';
      case 'NOT_DONE': return 'X';
      case 'NA': return 'NA';
      default: return '';
    }
  };

  return (
    <button
      onClick={() => onChange(getNextStatus(status))}
      className={`w-8 h-8 flex items-center justify-center border rounded-md transition-all duration-200 font-bold text-xs ${getStyle(status)} hover:shadow-sm`}
      title={`Status atual: ${status}. Clique para mudar.`}
    >
      {getIcon(status)}
    </button>
  );
};

export default StatusSelector;
