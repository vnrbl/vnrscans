# Performance Optimization Plan - Admin & Site-Wide

## Identified Performance Bottlenecks

### Admin Pages Issues:
1. **Dashboard**: 5 separate count queries running sequentially
2. **Series Page**: 
   - Loading ALL series at once (no pagination)
   - Calculating chapter counts for EACH series individually (N+1 query problem)
   - Heavy data processing on client-side
3. **Banners Page**: Multiple queries + drag-drop library overhead
4. **Auth Check**: beforeLoad runs synchronously on every admin route

### Site-Wide Issues:
1. No query staleTime - refetching too often
2. Missing loading states/skeletons
3. Large component bundles
4. No lazy loading for routes
5. Missing pagination on lists

## Optimization Strategy

### Phase 1: Quick Wins (Immediate)
- ✅ Add staleTime to all queries (5-10 minutes)
- ✅ Use React Query parallel queries
- ✅ Add pagination to series list
- ✅ Remove unnecessary N+1 queries
- ✅ Optimize dashboard counts (single aggregation query)

### Phase 2: Route Optimization
- ✅ Lazy load admin routes
- ✅ Code split heavy components
- ✅ Prefetch on hover

### Phase 3: Database Optimization
- ✅ Create database views for common aggregations
- ✅ Add indexes for frequently queried fields
- ✅ Use materialized views where appropriate

## Implementation

### 1. Dashboard - Parallel Queries
**Before**: 5 sequential queries (~2-3 seconds)
**After**: 1 parallel batch query (~300-500ms)

### 2. Series List - Pagination + Caching
**Before**: Load all series + calculate chapters individually
**After**: Paginate (20 per page) + use stored chapter_count

### 3. Global Query Defaults
Add staleTime to prevent unnecessary refetching

### 4. Lazy Loading
Split admin routes into separate chunks
