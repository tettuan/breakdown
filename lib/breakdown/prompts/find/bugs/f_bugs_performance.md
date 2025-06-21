# Performance Bug Detection Template

## Input
- {input_text_file}
- {input_text}

## Output
- {destination_path}

---

## Performance Analysis Framework

### 1. Algorithm Efficiency
- **Time Complexity**: Identify O(n²) or worse algorithms
- **Space Complexity**: Check memory usage patterns
- **Nested Loops**: Analyze loop nesting and iteration counts
- **Recursive Calls**: Review recursion depth and memoization

### 2. Database Performance
- **N+1 Queries**: Detect repeated database calls in loops
- **Missing Indexes**: Identify unindexed query fields
- **Query Optimization**: Review complex joins and subqueries
- **Connection Pooling**: Check database connection management

### 3. Memory Management
- **Memory Leaks**: Identify unreleased resources
- **Object Creation**: Check excessive object instantiation
- **Caching Strategy**: Review cache implementation and invalidation
- **Large Data Structures**: Analyze memory-intensive operations

### 4. I/O Operations
- **File Operations**: Check for inefficient file reading/writing
- **Network Calls**: Review API call patterns and batching
- **Blocking Operations**: Identify synchronous operations that could be async
- **Stream Processing**: Verify proper stream usage

### 5. Concurrency & Parallelism
- **Thread Contention**: Identify lock bottlenecks
- **Parallel Processing**: Check for parallelization opportunities
- **Async/Await**: Review asynchronous operation usage
- **Thread Pool Usage**: Analyze thread pool configuration

## Performance Bug Categories

### Impact Levels
| Level | Response Time Impact | Resource Impact | User Experience |
|-------|---------------------|-----------------|-----------------|
| Critical | >10s delay | System crash/OOM | Service unavailable |
| High | 3-10s delay | High CPU/Memory | Significant lag |
| Medium | 1-3s delay | Moderate usage | Noticeable delay |
| Low | <1s delay | Minor inefficiency | Minimal impact |

### Common Performance Anti-patterns
1. **Premature Pessimization**: Unnecessarily inefficient code
2. **Death by a Thousand Cuts**: Many small inefficiencies
3. **Synchronous Blocking**: Waiting unnecessarily
4. **Unbounded Growth**: No limits on data structures
5. **Cache Stampede**: Simultaneous cache misses

## Analysis Instructions

1. **Profiling Approach**: Identify performance hotspots systematically
2. **Benchmark Baseline**: Establish current performance metrics
3. **Scalability Analysis**: Consider performance under load
4. **Resource Constraints**: Account for deployment environment limits
5. **User Impact**: Prioritize user-facing performance issues

## Performance Metrics

### Key Indicators
- **Response Time**: API and page load times
- **Throughput**: Requests/transactions per second
- **Resource Usage**: CPU, memory, disk, network utilization
- **Concurrency**: Simultaneous user/request handling
- **Error Rate**: Performance-related failures

### Measurement Points
- Application startup time
- API endpoint response times
- Database query execution times
- Background job processing times
- Resource cleanup times

## Output Format

### Performance Report Structure

1. **Performance Summary**
   - Critical bottlenecks identified
   - Overall performance score
   - Quick wins vs. long-term optimizations

2. **Detailed Findings**
   ```markdown
   ### Issue: [Performance Issue Name]
   - **Location**: File:Line
   - **Current Performance**: X ms/ops
   - **Expected Performance**: Y ms/ops
   - **Impact**: Users/Operations affected
   - **Root Cause**: Detailed explanation
   - **Solution**: Optimization approach
   - **Code Example**:
     ```before
     // Inefficient code
     ```
     ```after
     // Optimized code
     ```
   ```

3. **Optimization Roadmap**
   - Immediate fixes (< 1 day)
   - Short-term improvements (< 1 week)
   - Architectural changes (> 1 week)

4. **Performance Testing Plan**
   - Load testing scenarios
   - Performance regression tests
   - Monitoring requirements
   - SLA definitions

5. **Best Practices Applied**
   - Language-specific optimizations
   - Framework performance guidelines
   - Industry standard approaches

## Optimization Techniques Reference

### General Strategies
- Lazy loading and pagination
- Caching at multiple levels
- Asynchronous processing
- Batch operations
- Connection pooling

### Language-Specific
- JIT compilation considerations
- Garbage collection tuning
- Native extension usage
- Compiler optimizations

### Framework-Specific
- ORM query optimization
- Template engine caching
- Middleware ordering
- Static asset optimization