# FormSheet Refactor Templates

## ✅ Completed Pages
1. **Todo.jsx** - ✅ Complete
2. **Places.jsx** - ✅ Complete

## 📋 Remaining Pages - Quick Refactor Guide

### Movies.jsx

**Changes needed:**
```jsx
// 1. Add import
import FormSheet from '../components/FormSheet'

// 2. Add state
const [formOpen, setFormOpen] = useState(false)

// 3. Update addMovie to close form
setFormOpen(false)  // Add after setForm(DEFAULT_MOVIE)

// 4. Remove inline form (lines ~90-130), replace with:
{/* FAB Button */}
<button 
  onClick={() => setFormOpen(true)}
  className="fixed bottom-20 lg:bottom-8 right-6 w-14 h-14 gradient-primary text-white rounded-full shadow-pink-lg hover:scale-110 smooth-transition z-30 flex items-center justify-center"
>
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
</button>

<FormSheet 
  isOpen={formOpen} 
  onClose={() => { setFormOpen(false); setForm(DEFAULT_MOVIE) }}
  title="Add Movie"
>
  <form onSubmit={addMovie} className="space-y-4">
    {/* Move existing form fields here */}
  </form>
</FormSheet>
```

---

### Activities.jsx

**Changes needed:**
```jsx
// 1. Add import
import FormSheet from '../components/FormSheet'

// 2. Add state
const [formOpen, setFormOpen] = useState(false)
const [editingId, setEditingId] = useState(null)

// 3. Update saveActivity to close form
setFormOpen(false)  // Add after successful save

// 4. Add resetForm function
const resetForm = () => {
  setForm(DEFAULT_ACTIVITY)
  setEditingId(null)
  setFormOpen(false)
}

// 5. Update editActivity
const editActivity = (activity) => {
  setEditingId(activity.id)
  setForm({...activity data...})
  setFormOpen(true)  // Instead of scrolling
}

// 6. Remove inline form, add FAB and FormSheet (same pattern as above)
```

---

### Memories.jsx (Most Complex)

**Changes needed:**
```jsx
// 1. Add import
import FormSheet from '../components/FormSheet'

// 2. Add state
const [formOpen, setFormOpen] = useState(false)

// 3. Update saveMemory to close form
setFormOpen(false)  // Add after successful save

// 4. Update editMemory
const editMemory = (memory) => {
  setEditingId(memory.id)
  setForm({...memory data...})
  setFormOpen(true)
}

// 5. Add resetForm
const resetForm = () => {
  setForm(DEFAULT_MEMORY)
  setEditingId(null)
  setSelectedPhoto(null)
  setPhotoPreview(null)
  setFormOpen(false)
}

// 6. Keep photo grid as main view
// 7. Remove inline form section
// 8. Add FAB button
// 9. Wrap form in FormSheet
```

**Note**: Memories page is the most complex because it has photo upload. The form will be larger in the FormSheet, but it will still work well.

---

## Quick Implementation Steps

For each remaining page:

1. **Backup the file** (already done for Movies)
2. **Add FormSheet import**
3. **Add formOpen state**
4. **Update save/add functions** to close form on success
5. **Add/update resetForm** to close form
6. **Update edit functions** to open form instead of scrolling
7. **Find the inline form JSX** (usually in a `<form className="card">` or similar)
8. **Cut the form JSX**
9. **Add FAB button** before closing `</div>`
10. **Add FormSheet** with the cut form JSX inside
11. **Test build**

---

## Common Patterns

### FAB Button (Copy-paste for all pages)
```jsx
<button 
  onClick={() => setFormOpen(true)}
  className="fixed bottom-20 lg:bottom-8 right-6 w-14 h-14 gradient-primary text-white rounded-full shadow-pink-lg hover:shadow-pink-lg hover:scale-110 smooth-transition z-30 flex items-center justify-center"
  aria-label="Add [item]"
>
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
</button>
```

### FormSheet Wrapper (Adjust title and form content)
```jsx
<FormSheet 
  isOpen={formOpen} 
  onClose={resetForm}
  title={editingId ? "Edit [Item]" : "Add New [Item]"}
>
  <form onSubmit={handleSubmit} className="space-y-4">
    {/* Existing form fields */}
    
    {/* Buttons at bottom */}
    <div className="flex gap-3 pt-4">
      <button
        type="button"
        onClick={resetForm}
        className="btn-outline flex-1"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={saving}
        className="btn-gradient flex-1 disabled:opacity-50"
      >
        {saving ? 'Saving...' : editingId ? 'Update' : 'Add'}
      </button>
    </div>
  </form>
</FormSheet>
```

---

## Estimated Time Per Page

- Movies.jsx: 15-20 minutes
- Activities.jsx: 15-20 minutes
- Memories.jsx: 30-40 minutes (more complex with photo upload)

**Total**: ~1-1.5 hours for all 3 pages

---

## After FormSheet Refactor is Complete

Move to:
1. **Phase 4**: Visual identity improvements
2. **Phase 5**: User attribution on all endpoints
3. **Phase 6**: Swipeable memory gallery
4. **Phase 7**: QoL features

Each phase has detailed implementation guides in `PHASE_3_TO_7_IMPLEMENTATION.md`.
