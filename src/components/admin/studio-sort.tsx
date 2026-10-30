'use client'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { useAdminText } from './studio-locale'
export function SortHeader({
  label,
  field,
  sort,
  onSort,
}: {
  label: string
  field: string
  sort: string
  onSort: (sort: string) => void
}) {
  const t = useAdminText()
  const active = sort.replace(/^-/, '').split(',')[0] === field
  const descending = sort.startsWith('-')
  return (
    <th aria-sort={active ? (descending ? 'descending' : 'ascending') : 'none'}>
      <button
        type="button"
        className={`studio-sort ${active ? 'active' : ''}`}
        onClick={() => onSort(active && !descending ? `-${field}` : field)}
      >
        {t(label)}
        {active ? (
          descending ? (
            <ArrowDown size={14} />
          ) : (
            <ArrowUp size={14} />
          )
        ) : (
          <ArrowUpDown size={14} />
        )}
      </button>
    </th>
  )
}
