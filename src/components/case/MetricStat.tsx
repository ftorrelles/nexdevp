import type { Metric, Locale } from '@/content/types'

interface MetricStatProps {
  metric: Metric
  locale: Locale
}

export function MetricStat({ metric, locale }: MetricStatProps) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-4">
      <span className="font-dm-mono text-4xl font-bold text-accent leading-none">
        {metric.value}
      </span>
      <span className="font-jost text-sm text-muted mt-2 leading-snug">
        {metric.label[locale]}
      </span>
    </div>
  )
}
