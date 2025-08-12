import React from 'react';

export function ControlsGuide() {
  return (
    <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-4">
      <h3 className="text-white text-sm font-semibold mb-3 text-center">조작법</h3>
      <div className="space-y-2 text-xs text-gray-300">
        <div className="flex justify-between">
          <span>← →</span>
          <span>이동</span>
        </div>
        <div className="flex justify-between">
          <span>↓</span>
          <span>빠른 하강</span>
        </div>
        <div className="flex justify-between">
          <span>↑</span>
          <span>회전</span>
        </div>
        <div className="flex justify-between">
          <span>스페이스</span>
          <span>즉시 하강</span>
        </div>
        <div className="flex justify-between">
          <span>P</span>
          <span>일시정지</span>
        </div>
      </div>
    </div>
  );
}
