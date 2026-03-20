import type { FC } from 'react'
import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import api, { getBookCoverUrl } from '@/api/axios'

type HighestRatedBook = {
  bookID: number
  title: string
  avgRating: number | string | null
  totalReviews: number
  isbn?: string | null
  userRating?: number | null
  author?: string | null
  genre?: string | null
  publisher?: string | null
  yearPublished?: number | null
}

type RecommendedBook = {
  bookID: number
  title: string
  avgRating: number | string | null
  isbn?: string | null
  userRating?: number | null
  author?: string | null
  genre?: string | null
  publisher?: string | null
  yearPublished?: number | null
}

type SearchResult = {
  bookID: number
  title: string
  author: string
  genre: string
  publisher: string
  yearPublished: number
  averageRating: number | string | null
  isbn?: string | null
  userRating?: number | null
}

// Lazy loading image component with strict priority loading
const LazyBookCover: FC<{ isbn: string; alt: string; isPriority: boolean }> = ({ isbn, alt, isPriority }) => {
  const imgRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!imgRef.current) return

    const element = imgRef.current

    // Priority items (visible on mount) load immediately
    if (isPriority) {
      setShouldLoad(true)
      return
    }

    // Non-priority items only load when they enter viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !shouldLoad) {
            setShouldLoad(true)
          }
        })
      },
      {
        rootMargin: '50px',
        threshold: 0.01
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [shouldLoad, isPriority])

  return (
    <div
      ref={imgRef}
      style={{
        width: '100%',
        height: '100%',
        background: hasError
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {shouldLoad && !hasError && (
        <img
          src={getBookCoverUrl(isbn)}
          alt={alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
          }}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true)
          }}
        />
      )}
      {(!shouldLoad || (shouldLoad && !isLoaded && !hasError)) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            opacity: 0.3
          }}
        >
          📚
        </div>
      )}
    </div>
  )
}

const HomePage: FC = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('q')

  const [highestRated, setHighestRated] = useState<HighestRatedBook[]>([])
  const [recommended, setRecommended] = useState<RecommendedBook[]>([])
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loadingTop, setLoadingTop] = useState(true)
  const [loadingRec, setLoadingRec] = useState(true)
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [errorTop, setErrorTop] = useState('')
  const [errorRec, setErrorRec] = useState('')
  const [errorSearch, setErrorSearch] = useState('')
  
  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState('')

  useEffect(() => {
    if (searchQuery) {
      // Skip loading regular carousels when searching
      setLoadingTop(false)
      setLoadingRec(false)
      return
    }

    const fetchHighestRated = async () => {
      try {
        setLoadingTop(true)
        const res = await api.get<HighestRatedBook[]>('/books/highest-rated', {
          params: { 
            days: 90,
            userId: user?.userID 
          }
        })
        setHighestRated(res.data)
      } catch (err) {
        console.error('Failed to load highest rated books', err)
        setErrorTop('Failed to load highest rated books.')
      } finally {
        setLoadingTop(false)
      }
    }

    fetchHighestRated()
  }, [searchQuery])

  useEffect(() => {
    if (!user || searchQuery) {
      setRecommended([])
      setLoadingRec(false)
      return
    }

    const fetchRecommended = async () => {
      try {
        setLoadingRec(true)
        const res = await api.get<RecommendedBook[]>('/books/recommended', {
          params: { userId: user.userID }
        })
        setRecommended(res.data)
      } catch (err) {
        console.error('Failed to load recommended books', err)
        setErrorRec('Failed to load recommendations.')
      } finally {
        setLoadingRec(false)
      }
    }

    fetchRecommended()
  }, [user, searchQuery])

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([])
      setLoadingSearch(false)
      setErrorSearch('')
      return
    }

    const fetchSearchResults = async () => {
      try {
        setLoadingSearch(true)
        setErrorSearch('')
        const res = await api.get<SearchResult[]>('/books/search', {
          params: { 
            q: searchQuery,
            userId: user?.userID 
          }
        })
        // Normalize averageRating to avgRating to match other book types
        const normalizedResults = res.data.map(book => ({
          ...book,
          avgRating: book.averageRating
        }))
        setSearchResults(normalizedResults as any)
      } catch (err) {
        console.error('Failed to search books', err)
        setErrorSearch('Failed to search books.')
      } finally {
        setLoadingSearch(false)
      }
    }

    fetchSearchResults()
  }, [searchQuery, user])

  const handleBookClick = (book: any) => {
    setSelectedBook(book)
    setUserRating(book.userRating || 0)
    setHoverRating(0)
    setReviewError('')
    setShowReviewModal(true)
  }

  const handleSubmitReview = async () => {
    if (!user) {
      setReviewError('You must be logged in to rate books.')
      return
    }

    if (userRating === 0) {
      setReviewError('Please select a rating.')
      return
    }

    try {
      setSubmittingReview(true)
      setReviewError('')

      const response = await api.post('/reviews', {
        userId: user.userID,
        bookId: selectedBook.bookID,
        rating: userRating
      })

      if (response.data.success) {
        // Update the user rating in the local state
        setHighestRated(prev => prev.map(book => 
          book.bookID === selectedBook.bookID 
            ? { ...book, userRating: userRating } 
            : book
        ))
        setRecommended(prev => prev.map(book => 
          book.bookID === selectedBook.bookID 
            ? { ...book, userRating: userRating } 
            : book
        ))
        setSearchResults(prev => prev.map(book => 
          book.bookID === selectedBook.bookID 
            ? { ...book, userRating: userRating } 
            : book
        ))
        setShowReviewModal(false)
      } else {
        setReviewError(response.data.message || 'Failed to submit review.')
      }
    } catch (err: any) {
      console.error('Error submitting review:', err)
      setReviewError('Failed to submit review. Please try again.')
    } finally {
      setSubmittingReview(false)
    }
  }

  const renderRow = <
    T extends {
      bookID: number
      title: string
      avgRating: number | string | null
      isbn?: string | null
      userRating?: number | null
    },
  >(
    title: string,
    items: T[],
    loading: boolean,
    error: string
  ) => {
    // Calculate how many items are visible in viewport (each card is ~176px wide with gap)
    const cardWidth = 176 // 160px + 16px gap
    const visibleCount = Math.ceil(window.innerWidth / cardWidth) + 2 // +2 for partial cards
    return (
      <section style={{ marginBottom: '48px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{title}</h2>
          {!loading && items.length > 5 && (
            <span style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>
              {items.length} books
            </span>
          )}
        </div>
        {loading ? (
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            overflowX: 'hidden',
            paddingBottom: '8px'
          }}>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                style={{
                  minWidth: '160px',
                  height: '280px',
                  borderRadius: '12px',
                  backgroundColor: '#f0f0f0',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  flexShrink: 0
                }}
              />
            ))}
          </div>
        ) : error ? (
          <div style={{ 
            padding: '32px',
            textAlign: 'center',
            backgroundColor: '#fff5f5',
            borderRadius: '12px',
            border: '1px solid #fed7d7'
          }}>
            <p style={{ color: '#c53030', margin: 0, fontSize: '14px' }}>{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div style={{ 
            padding: '48px',
            textAlign: 'center',
            backgroundColor: '#fafafa',
            borderRadius: '12px',
            border: '1px dashed #ddd'
          }}>
            <p style={{ color: '#999', margin: 0, fontSize: '15px' }}>No books to show yet</p>
          </div>
        ) : (
          <div
            className="book-row"
            style={{
              display: 'flex',
              overflowX: 'auto',
              gap: '16px',
              paddingBottom: '12px',
              scrollBehavior: 'smooth',
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e0 #f7fafc'
            }}
          >
            {items.map((book, index) => (
              <button
                key={book.bookID}
                onClick={() => handleBookClick(book)}
                className="book-card"
                style={{
                  minWidth: '160px',
                  maxWidth: '160px',
                  border: 'none',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
                  padding: '0',
                  textAlign: 'left',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)'
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '220px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {book.isbn ? (
                    <LazyBookCover 
                      isbn={book.isbn} 
                      alt={book.title} 
                      isPriority={index < visibleCount}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '48px',
                      opacity: 0.3
                    }}>
                      📚
                    </div>
                  )}
                  {book.userRating && (
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      backgroundColor: 'rgba(0, 123, 255, 0.9)',
                      backdropFilter: 'blur(8px)',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      zIndex: 1
                    }}>
                      <span>★</span>
                      {book.userRating}
                    </div>
                  )}
                  {(book.avgRating !== null && book.avgRating !== undefined && book.avgRating !== '') && (
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      backgroundColor: 'rgba(0,0,0,0.75)',
                      backdropFilter: 'blur(8px)',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      zIndex: 1
                    }}>
                      <span style={{ color: '#fbbf24' }}>⭐</span>
                      {Number(book.avgRating).toFixed(1)}
                    </div>
                  )}
                </div>
                <div style={{ padding: '12px' }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: '14px',
                      lineHeight: '1.4',
                      marginBottom: '4px',
                      color: '#1a1a1a',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      height: '40px'
                    }}
                  >
                    {book.title}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    )
  }

  // The HTML code was developed using AI assistance
  return (
    <div style={{ 
      padding: '0',
      minHeight: 'calc(100vh - 80px)',
      backgroundColor: '#fafafa'
    }}>
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
            {(selectedBook.author || selectedBook.yearPublished || selectedBook.publisher || selectedBook.genre) && (
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
            )}

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

            {reviewError && (
              <p style={{ color: '#dc3545', marginBottom: '16px', fontSize: '14px' }}>{reviewError}</p>
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
                onClick={handleSubmitReview}
                disabled={submittingReview || userRating === 0}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: userRating === 0 ? '#ccc' : '#007bff',
                  color: '#fff',
                  cursor: userRating === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  opacity: submittingReview ? 0.7 : 1
                }}
              >
                {submittingReview ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        padding: '32px 32px 48px 32px'
      }}>
        {searchQuery ? (
          <>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
                Search Results for "{searchQuery}"
              </h1>
              {!loadingSearch && searchResults.length > 0 && (
                <p style={{ color: '#666', fontSize: '16px' }}>
                  Found {searchResults.length} book{searchResults.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            
            {loadingSearch ? (
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '20px'
              }}>
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: '320px',
                      borderRadius: '12px',
                      backgroundColor: '#f0f0f0',
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }}
                  />
                ))}
              </div>
            ) : errorSearch ? (
              <div style={{ 
                padding: '48px',
                textAlign: 'center',
                backgroundColor: '#fff5f5',
                borderRadius: '12px',
                border: '1px solid #fed7d7'
              }}>
                <p style={{ color: '#c53030', margin: 0, fontSize: '16px' }}>{errorSearch}</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ 
                padding: '48px',
                textAlign: 'center',
                backgroundColor: '#fafafa',
                borderRadius: '12px',
                border: '1px dashed #ddd'
              }}>
                <p style={{ color: '#999', margin: 0, fontSize: '16px' }}>
                  No books found for "{searchQuery}"
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '20px'
              }}>
                {searchResults.map((book) => (
                  <div
                    key={book.bookID}
                    onClick={() => handleBookClick(book)}
                    style={{
                      borderRadius: '12px',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)'
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '280px',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {book.isbn ? (
                        <img
                          src={getBookCoverUrl(book.isbn)}
                          alt={book.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            const img = e.target as HTMLImageElement
                            img.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '64px',
                          opacity: 0.3
                        }}>
                          📚
                        </div>
                      )}
                      {book.userRating && (
                        <div style={{
                          position: 'absolute',
                          bottom: '8px',
                          left: '8px',
                          backgroundColor: 'rgba(0, 123, 255, 0.9)',
                          backdropFilter: 'blur(8px)',
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          zIndex: 1
                        }}>
                          <span>★</span>
                          {book.userRating}
                        </div>
                      )}
                      {(book.avgRating !== null && book.avgRating !== undefined && book.avgRating !== '') && (
                        <div style={{
                          position: 'absolute',
                          bottom: '8px',
                          right: '8px',
                          backgroundColor: 'rgba(0,0,0,0.75)',
                          backdropFilter: 'blur(8px)',
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          zIndex: 1
                        }}>
                          <span style={{ color: '#fbbf24' }}>⭐</span>
                          {Number(book.avgRating).toFixed(1)}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '16px' }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '16px',
                          lineHeight: '1.4',
                          marginBottom: '8px',
                          color: '#1a1a1a',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: '44px'
                        }}
                      >
                        {book.title}
                      </div>
                      {book.author && (
                        <div
                          style={{
                            fontSize: '14px',
                            color: '#666',
                            marginBottom: '4px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {book.author}
                        </div>
                      )}
                      {book.genre && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#999',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {book.genre}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {renderRow('Trending Now', highestRated, loadingTop, errorTop)}
            {user && renderRow('Picked for You', recommended, loadingRec, errorRec)}
          </>
        )}
      </div>

      <style>{`
        .book-row::-webkit-scrollbar {
          height: 8px;
        }
        .book-row::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .book-row::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 4px;
        }
        .book-row::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}

export default HomePage
