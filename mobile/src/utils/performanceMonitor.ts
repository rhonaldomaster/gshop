/**
 * Performance monitoring utilities
 * Track app performance metrics and bottlenecks
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private enabled: boolean = __DEV__; // Only in development

  /**
   * Start timing a performance metric
   */
  start(metricName: string): void {
    if (!this.enabled) return;

    this.metrics.set(metricName, {
      name: metricName,
      startTime: Date.now(),
    });
  }

  /**
   * Stop timing and calculate duration
   */
  end(metricName: string): number | null {
    if (!this.enabled) return null;

    const metric = this.metrics.get(metricName);
    if (!metric) {
      console.warn(`Metric "${metricName}" was not started`);
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    console.log(`[Performance] ${metricName}: ${duration}ms`);

    return duration;
  }

  /**
   * Mark a point in time
   */
  mark(markName: string): void {
    if (!this.enabled) return;
    console.log(`[Performance Mark] ${markName} at ${Date.now()}`);
  }

  /**
   * Measure time between two marks or from a metric start
   */
  measure(measureName: string, startMark: string): void {
    if (!this.enabled) return;

    const metric = this.metrics.get(startMark);
    if (!metric) {
      console.warn(`Start mark "${startMark}" not found`);
      return;
    }

    const duration = Date.now() - metric.startTime;
    console.log(`[Performance Measure] ${measureName}: ${duration}ms`);
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Log slow operations (threshold in ms)
   */
  logSlowOperations(threshold: number = 100): void {
    if (!this.enabled) return;

    const slowMetrics = Array.from(this.metrics.values())
      .filter(m => m.duration && m.duration > threshold)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0));

    if (slowMetrics.length > 0) {
      console.warn('[Performance] Slow operations detected:');
      slowMetrics.forEach(m => {
        console.warn(`  - ${m.name}: ${m.duration}ms`);
      });
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator/HOC for measuring function execution time
 */
export const measurePerformance = (
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const metricName = `${target.constructor.name}.${propertyKey}`;
    performanceMonitor.start(metricName);

    try {
      const result = await originalMethod.apply(this, args);
      performanceMonitor.end(metricName);
      return result;
    } catch (error) {
      performanceMonitor.end(metricName);
      throw error;
    }
  };

  return descriptor;
};

/**
 * Simple function wrapper for performance measurement
 */
export const measure = async <T>(
  name: string,
  fn: () => T | Promise<T>
): Promise<T> => {
  performanceMonitor.start(name);
  try {
    const result = await fn();
    performanceMonitor.end(name);
    return result;
  } catch (error) {
    performanceMonitor.end(name);
    throw error;
  }
};

/**
 * Hook for component render performance
 */
export const useRenderPerformance = (componentName: string): void => {
  if (__DEV__) {
    const renderCount = React.useRef(0);
    const startTime = React.useRef(Date.now());

    React.useEffect(() => {
      renderCount.current += 1;
      const renderTime = Date.now() - startTime.current;

      if (renderTime > 16) {
        // Slower than 60fps
        console.warn(
          `[Performance] ${componentName} render #${renderCount.current} took ${renderTime}ms`
        );
      }

      startTime.current = Date.now();
    });
  }
};

/**
 * Memory usage monitoring
 */
export const logMemoryUsage = (): void => {
  if (__DEV__ && (global as any).performance?.memory) {
    const memory = (global as any).performance.memory;
    console.log('[Memory] Usage:', {
      used: `${Math.round(memory.usedJSHeapSize / 1048576)}MB`,
      total: `${Math.round(memory.totalJSHeapSize / 1048576)}MB`,
      limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)}MB`,
    });
  }
};