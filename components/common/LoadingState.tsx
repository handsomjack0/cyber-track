import React from 'react';

const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 animate-fade-in">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <span className="font-medium text-sm tracking-wide">正在同步资产数据...</span>
    </div>
  );
};

export default LoadingState;
