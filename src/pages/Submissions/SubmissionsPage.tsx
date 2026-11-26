import { useState, useMemo, useRef, useEffect } from 'react'
import Select from 'react-select'
import type { SubmissionItem } from '@/types'
import { initialSubmissionsData } from '@/data/submissionsData'
import {
  subscribeSubmissions,
  deleteSubmission,
  deleteSubmissionsBulk,
} from '@/services/firebase/submissions'

const dateSortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
]

const voteSortOptions = [
  { value: 'none', label: 'Votes (Default)' },
  { value: 'votesDesc', label: 'Most Votes' },
  { value: 'votesAsc', label: 'Least Votes' },
]

export function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>(initialSubmissionsData)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateSort, setDateSort] = useState(dateSortOptions[0])
  const [voteSort, setVoteSort] = useState(voteSortOptions[0])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isDeleting, setIsDeleting] = useState(false)

  // Real-time Firestore sync
  useEffect(() => {
    const unsubscribe = subscribeSubmissions((liveData) => {
      if (liveData && liveData.length > 0) {
        setSubmissions(liveData)
      }
    })
    return () => unsubscribe()
  }, [])

  const itemsPerPage = 100
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null)

  // Filter & Sort logic identical to original netlify app
  const filteredAndSorted = useMemo(() => {
    let result = submissions.filter(
      (item) =>
        item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.localDateString.toLowerCase().includes(searchQuery.toLowerCase())
    )

    result.sort((a, b) => {
      if (voteSort.value === 'votesDesc') {
        const diff = (b.votes || 0) - (a.votes || 0)
        if (diff !== 0) return diff
      } else if (voteSort.value === 'votesAsc') {
        const diff = (a.votes || 0) - (b.votes || 0)
        if (diff !== 0) return diff
      }

      return dateSort.value === 'newest'
        ? (b.localDateString || '').localeCompare(a.localDateString || '')
        : (a.localDateString || '').localeCompare(b.localDateString || '')
    })

    return result
  }, [submissions, searchQuery, dateSort.value, voteSort.value])

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / itemsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPageItems = filteredAndSorted.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, dateSort.value, voteSort.value, submissions.length])

  // Indeterminate & Checkbox State
  const isAllSelected =
    filteredAndSorted.length > 0 && selectedIds.size === filteredAndSorted.length
  const isPartiallySelected =
    selectedIds.size > 0 && selectedIds.size < filteredAndSorted.length

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isPartiallySelected
    }
  }, [isPartiallySelected])

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredAndSorted.map((item) => item.docId)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      alert('Please select at least one item to delete.')
      return
    }
    const count = selectedIds.size
    if (window.confirm(`Are you sure you want to delete ${count} submission${count > 1 ? 's' : ''}?`)) {
      setIsDeleting(true)
      try {
        await deleteSubmissionsBulk(Array.from(selectedIds))
        setSubmissions((prev) => prev.filter((item) => !selectedIds.has(item.docId)))
        setSelectedIds(new Set())
        alert(`Successfully deleted ${count} submission${count > 1 ? 's' : ''}.`)
      } catch (e) {
        console.error(e)
        alert('Unable to delete submissions. Please try again.')
      } finally {
        setIsDeleting(false)
      }
    }
  }

  // Single Item Delete (or bulk if multiple selected and clicking one of the selected)
  const handleDeleteOne = async (item: SubmissionItem) => {
    if (selectedIds.size > 1 && selectedIds.has(item.docId)) {
      handleBulkDelete()
      return
    }
    if (window.confirm(`Are you sure you want to delete the submission by ${item.fullName}?`)) {
      setIsDeleting(true)
      try {
        await deleteSubmission(item.docId)
        setSubmissions((prev) => prev.filter((s) => s.docId !== item.docId))
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.delete(item.docId)
          return next
        })
      } catch (e) {
        console.error(e)
        alert('Unable to delete submission. Please try again.')
      } finally {
        setIsDeleting(false)
      }
    }
  }

  // Custom react-select styles matching official site bundle
  const selectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minWidth: '200px',
      border: state.isFocused ? '1px solid var(--submission-primary-color)' : '1px solid var(--submission-border-color)',
      borderRadius: '6px',
      fontSize: '14px',
      height: '38px',
      minHeight: '38px',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(36, 178, 149, 0.15)' : 'none',
      cursor: 'pointer',
      '&:hover': {
        borderColor: 'var(--submission-primary-color)',
      },
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? 'var(--submission-primary-color)' : 'white',
      color: state.isSelected ? 'white' : '#333',
      cursor: 'pointer',
      padding: '8px 14px',
      fontSize: '14px',
      '&:hover': {
        backgroundColor: state.isSelected
          ? 'var(--submission-primary-color)'
          : 'var(--submission-primary-light)',
      },
    }),
    menu: (provided: any) => ({
      ...provided,
      zIndex: 9999,
      borderRadius: '6px',
      border: '1px solid var(--submission-border-color)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
    }),
    menuList: (provided: any) => ({
      ...provided,
      padding: '0',
    }),
  }

  return (
    <div className="submission-container">
      {/* Centered Page Title */}
      <header>
        <div className="submission-logo-text">Submissions</div>
      </header>

      {/* Main Content Box */}
      <div className="submission-data-container">
        {/* Control Panel: Search & Sort Filters */}
        <div className="submission-control-panel-filters">
          {/* Full-width Search Input */}
          <div className="submission-search-container">
            <div className="submission-search-input-wrapper">
              <svg
                className="submission-search-icon"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="submission-search-input"
                placeholder="Search by Name or Date"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Centered Dropdown Filter Group */}
          <div className="submission-dropdown-container">
            <div className="submission-dropdown-group">
              <span className="submission-label-text">Sort by Date:</span>
              <div className="submission-select-container">
                <Select
                  value={dateSort}
                  onChange={(val) => val && setDateSort(val)}
                  options={dateSortOptions}
                  styles={selectStyles}
                  isSearchable={false}
                  placeholder="Sort by Date"
                  classNamePrefix="submission-select"
                />
              </div>
            </div>

            <div className="submission-dropdown-group">
              <span className="submission-label-text">Sort by Votes:</span>
              <div className="submission-select-container">
                <Select
                  value={voteSort}
                  onChange={(val) => val && setVoteSort(val)}
                  options={voteSortOptions}
                  styles={selectStyles}
                  isSearchable={false}
                  placeholder="Sort by Votes"
                  classNamePrefix="submission-select"
                />
              </div>
            </div>

            {selectedIds.size > 0 && (
              <button
                type="button"
                className="submission-bulk-delete-button"
                onClick={handleBulkDelete}
                disabled={isDeleting}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Delete Selected ({selectedIds.size})
              </button>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="submission-table-container">
          <table className="submission-table">
            <thead>
              <tr>
                <th className="submission-sl-no-header">
                  <div className="submission-slno-header-content">
                    <input
                      type="checkbox"
                      className="submission-checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isPartiallySelected
                      }}
                      onChange={(e) => handleToggleSelectAll(e.target.checked)}
                      title="Select all"
                    />
                    <span>Sl No.</span>
                  </div>
                </th>
                <th>Photo</th>
                <th>Name</th>
                <th>Votes</th>
                <th>Date</th>
                <th className="submission-action-header">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="submission-empty-state">
                    No submissions found.
                  </td>
                </tr>
              ) : (
                currentPageItems.map((item, index) => {
                  const isChecked = selectedIds.has(item.docId)

                  return (
                    <tr
                      key={item.docId || index}
                      style={{
                        backgroundColor: isChecked ? '#f0fdf9' : undefined,
                      }}
                    >
                      {/* Checkbox + Sl No. */}
                      <td className="submission-sl-no-cell">
                        <div className="submission-slno-cell-content">
                          <input
                            type="checkbox"
                            className="submission-checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectOne(item.docId)}
                          />
                          <span>{startIndex + index + 1}</span>
                        </div>
                      </td>

                      {/* Photo Thumbnail */}
                      <td className="submission-action-cell">
                        {item.photoUrl ? (
                          <div
                            className="submission-photo-container"
                            onClick={() => setPreviewPhoto(item.photoUrl)}
                            title="Click to view full photo"
                          >
                            <img
                              src={item.photoUrl}
                              alt={item.fullName}
                              className="submission-photo"
                              onError={(e: any) => {
                                e.target.onerror = null
                                e.target.style.display = 'none'
                                if (e.target.parentNode) {
                                  e.target.parentNode.innerHTML =
                                    '<div class="submission-photo-placeholder">No Image</div>'
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <span className="submission-muted-text">No photo</span>
                        )}
                      </td>

                      {/* Name */}
                      <td>{item.fullName}</td>

                      {/* Votes */}
                      <td>{item.votes}</td>

                      {/* Date */}
                      <td>{item.localDateString}</td>

                      {/* Action */}
                      <td className="submission-action-cell">
                        <button
                          type="button"
                          className="submission-delete-button"
                          onClick={() => handleDeleteOne(item)}
                          disabled={isDeleting}
                          title="Delete"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredAndSorted.length > 0 && totalPages > 1 && (
          <div className="submission-pagination">
            <div className="submission-page-numbers">
              {Array.from({ length: totalPages }, (_, j) => j + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  className={`submission-page-button ${pageNum === safeCurrentPage ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div className="submission-photo-modal" onClick={() => setPreviewPhoto(null)}>
          <div
            className="submission-photo-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="submission-photo-modal-close"
              onClick={() => setPreviewPhoto(null)}
            >
              &times;
            </span>
            <img
              src={previewPhoto}
              alt="Submission"
              className="submission-modal-photo"
              onError={(e: any) => {
                e.target.onerror = null
                e.target.src =
                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ENo Image Available%3C/text%3E%3C/svg%3E'
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
