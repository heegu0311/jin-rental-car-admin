'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Plus, Trash2, Tag, Edit2 } from 'lucide-react'

interface Category {
  id: string
  name: string
}

interface CategoryManagerProps {
  onCategoryChange?: () => void
}

export function CategoryManager({ onCategoryChange }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('vehicle_categories')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) setCategories(data)
  }

  const handleAdd = async () => {
    if (!newCategory.trim()) return
    setIsAdding(true)
    const { error } = await supabase
      .from('vehicle_categories')
      .insert([{ name: newCategory.trim() }])
    
    if (!error) {
      setNewCategory('')
      fetchCategories()
      onCategoryChange?.()
    } else {
      alert('카테고리 추가에 실패했습니다. (중복된 이름일 수 있습니다)')
    }
    setIsAdding(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 카테고리를 삭제하시겠습니까? 연결된 차량의 카테고리가 비워집니다.')) return
    
    const { error } = await supabase
      .from('vehicle_categories')
      .delete()
      .eq('id', id)
      
    if (!error) {
      fetchCategories()
      onCategoryChange?.()
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm"
      >
        <Tag size={18} />
        <span>카테고리 관리</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Tag size={18} className="text-blue-500" />
                차량 카테고리 관리
              </h2>
              <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  placeholder="새 카테고리 이름 (예: SUV)"
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
                <button
                  onClick={handleAdd}
                  disabled={isAdding || !newCategory.trim()}
                  className="px-5 py-2.5 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="space-y-2 mt-4 max-h-60 overflow-y-auto">
                {categories.length > 0 ? categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="font-semibold text-slate-700">{cat.name}</span>
                    <button 
                      onClick={() => handleDelete(cat.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )) : (
                  <p className="text-center text-sm text-slate-400 py-4">등록된 카테고리가 없습니다.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
