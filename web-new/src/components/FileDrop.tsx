'use client'

import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'

interface FileDropProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSize?: number
  className?: string
}

export function FileDrop({
  onFileSelect,
  accept = '*/*',
  maxSize = 50 * 1024 * 1024, // 50MB default
  className = '',
}: FileDropProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileSelect = (file: File) => {
    if (file.size > maxSize) {
      alert(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`)
      return
    }
    
    setSelectedFile(file)
    onFileSelect(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragOver ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}
        ${className}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />
      
      {selectedFile ? (
        <div className="space-y-2">
          <div className="text-green-500 font-medium">✓ File selected</div>
          <div className="text-sm text-foreground">{selectedFile.name}</div>
          <div className="text-xs text-muted-foreground">
            {(selectedFile.size / 1024).toFixed(2)} KB
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedFile(null)
            }}
            className="text-sm text-primary hover:underline"
          >
            Choose different file
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <div>
            <p className="text-foreground font-medium">Drop your file here</p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Max size: {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </div>
      )}
    </div>
  )
}
