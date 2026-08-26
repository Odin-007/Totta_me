# Phases 3-7 Implementation Guide

## ✅ Completed So Far

### Phase 1: Swipeable Tab Navigation ✅
- Created `TabNavigation.jsx` with horizontal scrollable tabs
- Updated `App.jsx` to show tabs on mobile, sidebar on desktop
- Added `.scrollbar-hide` CSS utility
- **Status**: Build successful, no errors

### Phase 2: Home Feed Timeline ✅
- Backend: Added `GET /api/feed` endpoint with user attribution
- Frontend: Completely rewrote `Dashboard.jsx` as timeline feed
- Features: Collapsible stats, feed items with creator badges, category colors
- **Status**: Build successful, no errors

### Phase 3: FormSheet Component ✅
- Created `FormSheet.jsx` reusable component
- Bottom sheet on mobile, modal on desktop
- Escape key support, backdrop click to close
- **Status**: Component ready, needs integration into pages

---

## 🚧 Phase 3: Remaining Work - Form Refactoring

### Pattern for Each Page

**Before** (inline form):
```jsx
<div>
  <form>...</form>  ← Always visible, clutters page
  <div>List of items</div>
</div>
```

**After** (FormSheet):
```jsx
<div>
  <div>Clean list/grid of items</div>
  <FAB onClick={() => setFormOpen(true)} />
  <FormSheet isOpen={formOpen} onClose={() => setFormOpen(false)}>
    <form>...</form>
  </FormSheet>
</div>
```

### Pages to Refactor

1. **Memories.jsx** (660 lines)
   - Move form into FormSheet
   - Keep photo grid as main view
   - FAB button to open form

2. **Movies.jsx**
   - Move form into FormSheet
   - Keep movie cards as main view
   - FAB button to open form

3. **Activities.jsx**
   - Move form into FormSheet
   - Keep activity list as main view
   - FAB button to open form

4. **Places.jsx**
   - Move form into FormSheet
   - Keep places list as main view
   - FAB button to open form

5. **Todo.jsx**
   - Move form into FormSheet
   - Keep todo list as main view
   - FAB button to open form

### Implementation Notes

- Each page keeps its existing state management
- Form validation stays the same
- Just wrap the form JSX in `<FormSheet>`
- Add `const [formOpen, setFormOpen] = useState(false)`
- Replace inline form with FAB button
- **Estimated time**: 2-3 hours for all 5 pages

---

## 🎨 Phase 4: Visual Identity

### Color System Enhancement

Add to `tailwind.config.js`:
```js
colors: {
  memory: {
    50: '#fdf2f8',
    100: '#fce7f3',
    // ... full pink scale
  },
  activity: {
    // purple scale
  },
  movie: {
    // amber scale
  },
  place: {
    // teal scale
  },
}
```

### Animations to Add

1. **Heart Pop** (on favorite/like)
```css
@keyframes heartPop {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}
```

2. **Confetti** (on activity completion)
- Use `canvas-confetti` library
- Trigger on checkbox toggle

3. **Parallax Scroll** (memory grid)
```css
.memory-card {
  transform: translateY(calc(var(--scroll) * -0.1px));
}
```

### Empty State Illustrations

Replace emoji-only empty states with:
- SVG illustrations (use https://undraw.co or similar)
- Encouraging copy
- Call-to-action buttons

### Login Screen Enhancement

- Add couple illustration background
- Gradient overlay
- More romantic copy

**Estimated time**: 2-3 hours

---

## 👤 Phase 5: User Attribution

### Backend Changes

Update all list endpoints to include user info:

```python
# Example for memories
memories_list = db.query(Memory).all()
result = []
for m in memories_list:
    user = db.query(User).filter(User.id == m.user_id).first()
    result.append({
        **MemoryResponse.from_orm(m).dict(),
        "created_by": user.name if user else "Unknown",
        "created_by_initials": user.initials if user else "?",
    })
```

Apply to:
- `GET /api/memories`
- `GET /api/activities`
- `GET /api/movies`
- `GET /api/places`
- `GET /api/todos`

### Frontend Changes

Add to every card component:
```jsx
<div className="flex items-center gap-2">
  <div className="w-6 h-6 rounded-full gradient-primary text-white text-xs font-bold flex items-center justify-center">
    {item.created_by_initials}
  </div>
  <span className="text-xs text-gray-600">Added by {item.created_by}</span>
</div>
```

**Estimated time**: 1-2 hours

---

## 📱 Phase 6: Swipeable Memory Gallery

### Install Dependencies

```bash
npm install react-use-gesture
```

### Implementation

Replace `MemoryModal` with:
```jsx
import { useGesture } from 'react-use-gesture'

function MemoryGallery({ memories, initialIndex, onClose }) {
  const [index, setIndex] = useState(initialIndex)
  
  const bind = useGesture({
    onDrag: ({ swipe: [swipeX] }) => {
      if (swipeX === -1) setIndex(i => Math.min(i + 1, memories.length - 1))
      if (swipeX === 1) setIndex(i => Math.max(i - 1, 0))
    },
  })
  
  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div {...bind()} className="h-full">
        <img src={memories[index].photo_url} className="h-full w-full object-contain" />
      </div>
      {/* Bottom drawer for notes/tags */}
    </div>
  )
}
```

**Estimated time**: 3-4 hours

---

## ✨ Phase 7: Quality of Life

### 1. Confirm Dialog Component

```jsx
// components/ConfirmDialog.jsx
export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  return (
    <FormSheet isOpen={isOpen} onClose={onCancel} title={title}>
      <p>{message}</p>
      <div className="flex gap-3 mt-6">
        <button onClick={onCancel} className="btn-outline flex-1">Cancel</button>
        <button onClick={onConfirm} className="btn-danger flex-1">Delete</button>
      </div>
    </FormSheet>
  )
}
```

Usage:
```jsx
const [confirmDelete, setConfirmDelete] = useState(null)

<ConfirmDialog
  isOpen={!!confirmDelete}
  title="Delete Memory?"
  message="This action cannot be undone."
  onConfirm={() => { deleteMemory(confirmDelete); setConfirmDelete(null) }}
  onCancel={() => setConfirmDelete(null)}
/>
```

### 2. Global Search

Backend:
```python
@app.get("/api/search")
async def search(q: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    results = {
        "memories": db.query(Memory).filter(Memory.title.ilike(f"%{q}%")).limit(5).all(),
        "movies": db.query(Movie).filter(Movie.title.ilike(f"%{q}%")).limit(5).all(),
        # ... etc
    }
    return results
```

Frontend:
```jsx
// Add to Header.jsx
const [searchOpen, setSearchOpen] = useState(false)
const [searchQuery, setSearchQuery] = useState('')
const [searchResults, setSearchResults] = useState([])
```

### 3. Pull-to-Refresh

```bash
npm install react-pull-to-refresh
```

```jsx
import PullToRefresh from 'react-pull-to-refresh'

<PullToRefresh onRefresh={loadData}>
  <div>Your list</div>
</PullToRefresh>
```

### 4. Lazy Loading Images

```jsx
<img 
  src={photo_url} 
  loading="lazy"
  className="blur-sm transition-all duration-300"
  onLoad={(e) => e.target.classList.remove('blur-sm')}
/>
```

### 5. Optimistic UI

```jsx
const toggleVisited = async (placeId) => {
  // Optimistic update
  setPlaces(places.map(p => 
    p.id === placeId ? { ...p, visited: !p.visited } : p
  ))
  
  try {
    await places.update(placeId, { visited: !place.visited })
  } catch (err) {
    // Rollback on error
    setPlaces(places.map(p => 
      p.id === placeId ? { ...p, visited: !p.visited } : p
    ))
    toast.error('Failed to update')
  }
}
```

**Estimated time**: 2-3 hours

---

## Testing Checklist

- [ ] Mobile: Tab navigation scrolls smoothly
- [ ] Desktop: Sidebar still visible
- [ ] Feed loads with user attribution
- [ ] Stats collapse/expand works
- [ ] FormSheet opens on FAB click (all pages)
- [ ] Forms submit correctly from FormSheet
- [ ] Escape key closes FormSheet
- [ ] Backdrop click closes FormSheet
- [ ] Memory gallery swipes left/right
- [ ] Confirm dialog shows before delete
- [ ] Search returns results
- [ ] Pull-to-refresh reloads data
- [ ] Images lazy load with blur effect
- [ ] Optimistic UI updates instantly
- [ ] Dark mode works with new components
- [ ] PWA still installs
- [ ] Export still works

---

## Deployment Notes

1. **Backend**: No database migrations needed
2. **Frontend**: 
   - New dependencies: `react-use-gesture`, `react-pull-to-refresh`, `canvas-confetti`
   - Run `npm install` before deploying
3. **Environment**: No new env vars needed

---

## Estimated Total Time

- Phase 3: 2-3 hours
- Phase 4: 2-3 hours
- Phase 5: 1-2 hours
- Phase 6: 3-4 hours
- Phase 7: 2-3 hours

**Total**: 10-15 hours of focused development

---

## Priority Order

If time-constrained, implement in this order:

1. **Phase 3** (FormSheet) - Biggest UX improvement
2. **Phase 5** (Attribution) - Important for shared app
3. **Phase 7** (QoL) - Quick wins
4. **Phase 4** (Visual) - Polish
5. **Phase 6** (Gallery) - Nice-to-have

---

## Next Steps

1. Complete Phase 3 form refactoring (5 pages)
2. Test build after each page
3. Move to Phase 4 visual improvements
4. Continue sequentially through Phase 7
