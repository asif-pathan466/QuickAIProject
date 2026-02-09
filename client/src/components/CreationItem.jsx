import React, { useState } from 'react'
import Markdown from 'react-markdown'

const CreationItem = ({ item }) => {
  const [expanded, setExpanded] = useState(false)

  const toggleExpand = () => setExpanded(prev => !prev)

  return (
    <div 
      onClick={toggleExpand}
      className='p-4 max-w-5xl text-sm bg-white border border-gray-200 rounded-lg cursor-pointer'
    >
      {/* Header */}
      <div className='flex justify-between items-center gap-4'>
        <div>
          <h2 className='font-medium'>{item.prompt}</h2>

          <p className='text-gray-500'>
            {item.type} -{" "}
            {item.created_at
              ? new Date(item.created_at).toLocaleDateString('en-IN')
              : "No date"}
          </p>
        </div>

        <span className='bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF]
          px-4 py-1 rounded-full'>
          {item.type}
        </span>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className='mt-3'>
          {item.type === 'image' ? (
            <img 
              src={item.content} 
              alt="Generated"
              className='w-full max-w-md rounded-md'
            />
          ) : (
            <div 
              className='max-h-40 overflow-y-scroll text-sm text-slate-700 '
              onClick={(e) => e.stopPropagation()} // prevents accidental collapse
            >
              <div className='reset-tw prose prose-sm max-w-none'>
                <Markdown>{item.content}</Markdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CreationItem
