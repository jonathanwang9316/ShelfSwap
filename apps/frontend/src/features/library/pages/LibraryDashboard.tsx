import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import BookCard from '../components/BookCard'
import api, { getBookCoverUrl } from '@/api/axios'
import axios from 'axios'

type UserBook = {
  copyID: number
  userID: number
  bookID: number
  condition: string
  canExchange: boolean
  title: string
  author: string
  isbn: string
  genre: string
  publisher: string
  yearPublished: number
  averageRating: number
  userRating?: number
}

const LibraryDashboard: FC = () => {
  const { user } = useAuth()
  const [books, setBooks] = useState<UserBook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isbnInput, setIsbnInput] = useState('')
  const [conditionInput, setConditionInput] = useState('Good')
  const [canExchangeInput, setCanExchangeInput] = useState(true)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [coverLoading, setCoverLoading] = useState(false)
  const [coverError, setCoverError] = useState('')
  
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedBook, setSelectedBook] = useState<UserBook | null>(null)
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState('')
  
  const [editCondition, setEditCondition] = useState('')
  const [editCanExchange, setEditCanExchange] = useState(true)
  const [updateError, setUpdateError] = useState('')

  useEffect(() => {
    const fetchUserBooks = async () => {
      if (!user) return

      try {
        setLoading(true)
        const response = await api.get('/userCopies', {
          params: { userId: user.userID }
        })
        setBooks(response.data)
      } catch (err: any) {
        console.error('Error fetching books:', err)
        setError('Failed to load your library')
      } finally {
        setLoading(false)
      }
    }

    fetchUserBooks()
  }, [user])

  const handleDeleteBook = async (copyID: number) => {
    try {
      const response = await api.delete(`/userCopies/${copyID}`)

      if (response.data.success) {
        setBooks(books.filter(book => book.copyID !== copyID))
      }
    } catch (err: any) {
      console.error('Error deleting book:', err)
      alert('Failed to delete book. Please try again.')
    }
  }

  useEffect(() => {
    if (!showAddModal) return

    const trimmed = isbnInput.trim()

    if (trimmed.length !== 10) {
      setCoverUrl(null)
      setCoverError('')
      return
    }

    const controller = new AbortController()

    const fetchCover = async () => {
      try {
        setCoverLoading(true)
        setCoverError('')

        const response = await axios.get(getBookCoverUrl(trimmed), {
          responseType: 'blob',
          signal: controller.signal
        })

        const url = URL.createObjectURL(response.data)
        setCoverUrl(url)
      } catch (err: any) {
        if (controller.signal.aborted) return
        console.error('Error loading cover preview:', err)
        setCoverUrl(null)
        setCoverError('Could not load cover preview')
      } finally {
        if (!controller.signal.aborted) {
          setCoverLoading(false)
        }
      }
    }

    fetchCover()

    return () => {
      controller.abort()
      if (coverUrl) {
        URL.revokeObjectURL(coverUrl)
      }
    }
  }, [isbnInput, showAddModal])

  const handleAddBook = async () => {
    if (!user) return
    if (!isbnInput.trim()) {
      setAddError('Please enter an ISBN.')
      return
    }

    if (isbnInput.trim().length !== 10) {
      setAddError('Please enter a valid 10-digit ISBN.')
      return
    }

    try {
      setAdding(true)
      setAddError('')

      const response = await api.post('/userCopies', {
        userId: user.userID,
        isbn: isbnInput.trim(),
        condition: conditionInput,
        canExchange: canExchangeInput
      })

      if (response.data.success) {
        // Refresh the list
        const refreshed = await api.get('/userCopies', {
          params: { userId: user.userID }
        })
        setBooks(refreshed.data)
        setIsbnInput('')
        setConditionInput('Good')
        setCanExchangeInput(true)
        setCoverUrl(null)
        setCoverError('')
        setShowAddModal(false)
      } else {
        setAddError(response.data.message || 'Failed to add book.')
      }
    } catch (err: any) {
      console.error('Error adding book:', err)
      setAddError('Failed to add book. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  const handleBookClick = (book: UserBook) => {
    setSelectedBook(book)
    setUserRating(book.userRating || 0)
    setHoverRating(0)
    setReviewError('')
    setEditCondition(book.condition || 'Good')
    setEditCanExchange(book.canExchange ?? true)
    setUpdateError('')
    setShowReviewModal(true)
  }

  const handleSaveChanges = async () => {
    if (!user || !selectedBook) {
      setReviewError('Unable to save changes.')
      return
    }

    try {
      setSubmittingReview(true)
      setReviewError('')
      setUpdateError('')

      const updateResponse = await api.put(`/userCopies/${selectedBook.copyID}`, {
        condition: editCondition,
        canExchange: editCanExchange
      })

      if (!updateResponse.data.success) {
        setUpdateError(updateResponse.data.message || 'Failed to update book details.')
        setSubmittingReview(false)
        return
      }

      if (userRating > 0) {
        const reviewResponse = await api.post('/reviews', {
          userId: user.userID,
          bookId: selectedBook.bookID,
          rating: userRating
        })

        if (!reviewResponse.data.success) {
          setReviewError(reviewResponse.data.message || 'Failed to submit rating.')
          setSubmittingReview(false)
          return
        }
      }

      setShowReviewModal(false)
      const refreshed = await api.get('/userCopies', {
        params: { userId: user.userID }
      })
      setBooks(refreshed.data)
    } catch (err: any) {
      console.error('Error saving changes:', err)
      setReviewError('Failed to save changes. Please try again.')
    } finally {
      setSubmittingReview(false)
    }
  }

  // The HTML code was developed using AI assistance
  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>My Library</h1>
        <p>Loading your books...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>My Library</h1>
        <p style={{ color: '#dc3545' }}>{error}</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Review Modal */}
      {showReviewModal && selectedBook && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowReviewModal(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: '8px', fontSize: '24px', fontWeight: 700 }}>
              {selectedBook.title}
            </h2>
            
            {/* Book Details */}
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                {selectedBook.author && (
                  <div><strong>Author:</strong> {selectedBook.author}</div>
                )}
                {selectedBook.yearPublished && (
                  <div><strong>Year:</strong> {selectedBook.yearPublished}</div>
                )}
                {selectedBook.publisher && (
                  <div><strong>Publisher:</strong> {selectedBook.publisher}</div>
                )}
                {selectedBook.genre && (
                  <div><strong>Genre:</strong> {selectedBook.genre}</div>
                )}
              </div>
            </div>

            {/* Star Rating */}
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', gap: '8px', marginBottom: '8px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      fontSize: '48px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0',
                      color: (hoverRating || userRating) >= star ? '#fbbf24' : '#e5e7eb',
                      transition: 'all 0.2s',
                      transform: (hoverRating || userRating) >= star ? 'scale(1.1)' : 'scale(1)'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
              {userRating > 0 && (
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  {userRating === 1 ? 'Poor' : userRating === 2 ? 'Fair' : userRating === 3 ? 'Good' : userRating === 4 ? 'Very Good' : 'Excellent'}
                </p>
              )}
            </div>

            {/* Condition and Availability */}
            <div style={{ marginBottom: '24px', display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                  Condition
                </label>
                <select
                  value={editCondition}
                  onChange={(e) => setEditCondition(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="checkbox"
                  id="canExchange"
                  checked={editCanExchange}
                  onChange={(e) => setEditCanExchange(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer'
                  }}
                />
                <label htmlFor="canExchange" style={{ fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                  Available for exchange
                </label>
              </div>
            </div>

            {reviewError && (
              <p style={{ color: '#dc3545', marginBottom: '16px', fontSize: '14px' }}>{reviewError}</p>
            )}

            {updateError && (
              <p style={{ color: '#dc3545', marginBottom: '16px', fontSize: '14px' }}>{updateError}</p>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #ccc',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={submittingReview}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#007bff',
                  color: '#fff',
                  cursor: submittingReview ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  opacity: submittingReview ? 0.7 : 1
                }}
              >
                {submittingReview ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div>
        <h1 style={{ marginBottom: '8px' }}>My Library</h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          You have {books.length} book{books.length !== 1 ? 's' : ''} in your library
        </p>
      </div>

        <button
          onClick={() => {
            setShowAddModal(true)
            setAddError('')
          }}
          style={{
            padding: '8px 14px',
            borderRadius: '999px',
            border: 'none',
            backgroundColor: '#007bff',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span>
          <span>Add book</span>
        </button>
      </div>

      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '20px 24px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: '16px' }}>Add a book</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>
                  ISBN
                </label>
                <input
                  type="text"
                  placeholder="Enter ISBN-10 (10 digits)"
                  value={isbnInput}
                  onChange={(e) => setIsbnInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>
                    Condition
                  </label>
                  <select
                    value={conditionInput}
                    onChange={(e) => setConditionInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #ccc',
                      outline: 'none'
                    }}
                  >
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '22px', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={canExchangeInput}
                    onChange={(e) => setCanExchangeInput(e.target.checked)}
                  />
                  Available to trade
                </label>
              </div>

              <div style={{ minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', borderRadius: '8px', overflow: 'hidden' }}>
                {coverLoading && <p style={{ color: '#666' }}>Loading cover preview...</p>}
                {!coverLoading && coverUrl && (
                  <img
                    src={coverUrl}
                    alt="Book cover preview"
                    style={{ maxHeight: '160px', maxWidth: '100%', objectFit: 'contain' }}
                  />
                )}
                {!coverLoading && !coverUrl && !coverError && (
                  <p style={{ color: '#888', fontSize: '14px' }}>
                    Enter a valid 10-digit ISBN to see the cover preview.
                  </p>
                )}
                {!coverLoading && coverError && (
                  <p style={{ color: '#dc3545', fontSize: '14px' }}>{coverError}</p>
                )}
              </div>

              {addError && (
                <p style={{ color: '#dc3545', marginTop: '4px' }}>{addError}</p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setAddError('')
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    backgroundColor: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddBook}
                  disabled={adding}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#007bff',
                    color: '#fff',
                    cursor: 'pointer',
                    opacity: adding ? 0.8 : 1
                  }}
                >
                  {adding ? 'Adding...' : 'Add to library'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {books.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <p style={{ fontSize: '18px', color: '#666' }}>
            Your library is empty. Start adding books!
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}>
          {books.map((book) => (
            <BookCard
              key={book.copyID}
              copyID={book.copyID}
              title={book.title}
              author={book.author}
              isbn={book.isbn}
              genre={book.genre}
              condition={book.condition}
              canExchange={book.canExchange}
              yearPublished={book.yearPublished}
              averageRating={book.averageRating}
              userRating={book.userRating}
              onClick={() => handleBookClick(book)}
              onDelete={handleDeleteBook}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default LibraryDashboard
