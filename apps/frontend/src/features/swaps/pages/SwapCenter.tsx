import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import api, { getBookCoverUrl } from '@/api/axios'

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

type BookOwner = {
  copyID: number
  userID: number
  condition: string
  canExchange: boolean
  bookID: number
  title: string
  author: string
  isbn: string | null
  ownerName: string
}

type UserBook = {
  copyID: number
  bookID: number
  title: string
  author: string
  isbn: string | null
  condition: string
  canExchange: boolean
}

type ExchangeRequest = {
  requestID: number
  requesterID: number
  receiverID: number
  requesterCopyID: number
  receiverCopyID: number
  dateCreated: string
  status: string
  dateExchanged: string | null
  isReturned: boolean
  requesterName: string
  receiverName: string
  requesterBookTitle: string
  requesterBookAuthor: string
  requesterBookISBN: string | null
  receiverBookTitle: string
  receiverBookAuthor: string
  receiverBookISBN: string | null
  requesterBookCondition: string
  receiverBookCondition: string
}

const SwapCenter: FC = () => {
  const { user } = useAuth()
  const [requests, setRequests] = useState<ExchangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('received')
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState<Set<number>>(new Set())
  
  // Swap request modal state
  const [showSwapModal, setShowSwapModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [selectedBook, setSelectedBook] = useState<SearchResult | null>(null)
  const [bookOwners, setBookOwners] = useState<BookOwner[]>([])
  const [loadingOwners, setLoadingOwners] = useState(false)
  const [userBooks, setUserBooks] = useState<UserBook[]>([])
  const [loadingUserBooks, setLoadingUserBooks] = useState(false)
  const [selectedOwner, setSelectedOwner] = useState<BookOwner | null>(null)
  const [selectedUserBook, setSelectedUserBook] = useState<UserBook | null>(null)
  const [sendingRequest, setSendingRequest] = useState(false)
  const [swapError, setSwapError] = useState('')

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return

      try {
        setLoading(true)
        setError('')

        const response = await api.get<ExchangeRequest[]>('/exchanges', {
          params: { userId: user.userID }
        })

        setRequests(response.data)
      } catch (err: any) {
        console.error('Error fetching exchange requests:', err)
        setError('Failed to load exchange requests')
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [user])

  // Fetch user's books for offering
  useEffect(() => {
    const fetchUserBooks = async () => {
      if (!user || !showSwapModal) return

      try {
        setLoadingUserBooks(true)
        const response = await api.get('/userCopies', {
          params: { userId: user.userID }
        })
        // Filter to only books available for exchange
        const exchangeableBooks = response.data.filter((book: UserBook) => book.canExchange)
        setUserBooks(exchangeableBooks)
      } catch (err: any) {
        console.error('Error fetching user books:', err)
      } finally {
        setLoadingUserBooks(false)
      }
    }

    fetchUserBooks()
  }, [user, showSwapModal])

  // Search for books
  useEffect(() => {
    if (!searchQuery || !showSwapModal) {
      setSearchResults([])
      setLoadingSearch(false)
      return
    }

    const fetchSearchResults = async () => {
      try {
        setLoadingSearch(true)
        const res = await api.get<SearchResult[]>('/books/search', {
          params: { 
            q: searchQuery,
            userId: user?.userID 
          }
        })
        // Normalize averageRating to avgRating
        const normalizedResults = res.data.map(book => ({
          ...book,
          avgRating: book.averageRating
        }))
        setSearchResults(normalizedResults as any)
      } catch (err) {
        console.error('Failed to search books', err)
      } finally {
        setLoadingSearch(false)
      }
    }

    const timeoutId = setTimeout(() => {
      fetchSearchResults()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, user, showSwapModal])

  // Fetch book owners when a book is selected
  const handleBookSelect = async (book: SearchResult) => {
    if (!user) return

    setSelectedBook(book)
    setSelectedOwner(null)
    setSelectedUserBook(null)
    setBookOwners([])

    try {
      setLoadingOwners(true)
      const response = await api.get<BookOwner[]>(`/exchanges/book-owners/${book.bookID}`, {
        params: { userId: user.userID }
      })
      setBookOwners(response.data)
    } catch (err: any) {
      console.error('Error fetching book owners:', err)
      setSwapError(err.response?.data?.message || 'Failed to load book owners')
    } finally {
      setLoadingOwners(false)
    }
  }

  // Send swap request
  const handleSendRequest = async () => {
    if (!user || !selectedOwner || !selectedUserBook) return

    try {
      setSendingRequest(true)
      setSwapError('')

      const response = await api.post('/exchanges', {
        requesterID: user.userID,
        receiverID: selectedOwner.userID,
        requesterCopyID: selectedUserBook.copyID,
        receiverCopyID: selectedOwner.copyID
      })

      if (response.data.success) {
        // Close modal and refresh requests
        setShowSwapModal(false)
        setSearchQuery('')
        setSearchResults([])
        setSelectedBook(null)
        setBookOwners([])
        setSelectedOwner(null)
        setSelectedUserBook(null)
        
        // Refresh requests list
        const refreshed = await api.get<ExchangeRequest[]>('/exchanges', {
          params: { userId: user.userID }
        })
        setRequests(refreshed.data)
        
        alert('Swap request sent successfully!')
      }
    } catch (err: any) {
      console.error('Error sending swap request:', err)
      setSwapError(err.response?.data?.message || 'Failed to send swap request')
    } finally {
      setSendingRequest(false)
    }
  }

  // Reset modal state when closed
  const handleCloseModal = () => {
    setShowSwapModal(false)
    setSearchQuery('')
    setSearchResults([])
    setSelectedBook(null)
    setBookOwners([])
    setSelectedOwner(null)
    setSelectedUserBook(null)
    setSwapError('')
  }

  const handleAccept = async (requestId: number) => {
    if (!user) return

    try {
      setProcessing(prev => new Set(prev).add(requestId))
      const response = await api.put(`/exchanges/${requestId}/accept`, {
        userId: user.userID
      })

      if (response.data.success) {
        // Refresh requests
        const refreshed = await api.get<ExchangeRequest[]>('/exchanges', {
          params: { userId: user.userID }
        })
        setRequests(refreshed.data)
      }
    } catch (err: any) {
      console.error('Error accepting request:', err)
      alert(err.response?.data?.message || 'Failed to accept request')
    } finally {
      setProcessing(prev => {
        const next = new Set(prev)
        next.delete(requestId)
        return next
      })
    }
  }

  const handleReject = async (requestId: number) => {
    if (!user) return

    if (!window.confirm('Are you sure you want to reject this exchange request?')) {
      return
    }

    try {
      setProcessing(prev => new Set(prev).add(requestId))
      const response = await api.put(`/exchanges/${requestId}/reject`, {
        userId: user.userID
      })

      if (response.data.success) {
        // Refresh requests
        const refreshed = await api.get<ExchangeRequest[]>('/exchanges', {
          params: { userId: user.userID }
        })
        setRequests(refreshed.data)
      }
    } catch (err: any) {
      console.error('Error rejecting request:', err)
      alert(err.response?.data?.message || 'Failed to reject request')
    } finally {
      setProcessing(prev => {
        const next = new Set(prev)
        next.delete(requestId)
        return next
      })
    }
  }

  const handleReturn = async (requestId: number) => {
    if (!user) return

    if (!window.confirm('Mark this book as returned?')) {
      return
    }

    try {
      setProcessing(prev => new Set(prev).add(requestId))
      const response = await api.put(`/exchanges/${requestId}/return`, {
        userId: user.userID
      })

      if (response.data.success) {
        // Refresh requests
        const refreshed = await api.get<ExchangeRequest[]>('/exchanges', {
          params: { userId: user.userID }
        })
        setRequests(refreshed.data)
      }
    } catch (err: any) {
      console.error('Error marking as returned:', err)
      alert(err.response?.data?.message || 'Failed to mark as returned')
    } finally {
      setProcessing(prev => {
        const next = new Set(prev)
        next.delete(requestId)
        return next
      })
    }
  }

  const formatDate = (dateString: string | null | number) => {
    // Handle null, undefined, 0, or empty
    if (!dateString || dateString === 0 || dateString === '0') return ''
    
    try {
      // Convert to string and trim
      let cleanDate = String(dateString).trim()
      
      // Check if it's just "0" or invalid string values
      if (cleanDate === '0' || cleanDate === 'null' || cleanDate === 'undefined' || cleanDate === '') {
        return ''
      }
      
      // Handle MySQL datetime format: "2025-10-31 00:00:00"
      // Extract only the valid MySQL datetime pattern
      const mysqlDateMatch = cleanDate.match(/^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/)
      if (!mysqlDateMatch) {
        return ''
      }
      
      // Use only the matched portion to avoid any trailing characters
      cleanDate = mysqlDateMatch[1]
      
      // Parse MySQL datetime format explicitly
      // Convert "2025-10-31 00:00:00" to "2025-10-31T00:00:00" for ISO format
      const isoDate = cleanDate.replace(' ', 'T')
      const date = new Date(isoDate)
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return ''
      }
      
      // Check if date is reasonable (not year 1970 or invalid)
      if (date.getFullYear() < 2000 || date.getFullYear() > 2100) {
        return ''
      }
      
      // Format the date parts separately
      const datePart = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      })
      
      const timePart = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
      
      const result = `${datePart}, ${timePart}`.trim()
      
      // Final validation - ensure result is valid
      if (!result || result.length < 10) {
        return ''
      }
      
      return result
    } catch (err) {
      console.error('Error formatting date:', dateString, err)
      return ''
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Pending': '#ffc107',
      'Accepted': '#28a745',
      'Rejected': '#dc3545',
      'Completed': '#17a2b8'
    }
    return colors[status] || '#6c757d'
  }

  const getStatusBg = (status: string) => {
    const colors: Record<string, string> = {
      'Pending': '#fff3cd',
      'Accepted': '#d4edda',
      'Rejected': '#f8d7da',
      'Completed': '#d1ecf1'
    }
    return colors[status] || '#e2e3e5'
  }

  const sentRequests = requests.filter(r => r.requesterID === user?.userID)
  const receivedRequests = requests.filter(r => r.receiverID === user?.userID)
  const requestsToShow = activeTab === 'sent' ? sentRequests : receivedRequests

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '20px' }}>Swap Center</h1>
        <p>Loading exchange requests...</p>
      </div>
    )
  }

  // The HTML code was developed using AI assistance
  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ marginBottom: '8px', fontSize: '32px', fontWeight: 700 }}>
            Swap Center
          </h1>
          <p style={{ color: '#666', fontSize: '16px' }}>
            Manage your book exchange requests
          </p>
        </div>
        <button
          onClick={() => setShowSwapModal(true)}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#007bff',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <span>+</span>
          <span>Send Swap Request</span>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <button
          onClick={() => setActiveTab('received')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === 'received' ? '3px solid #007bff' : '3px solid transparent',
            color: activeTab === 'received' ? '#007bff' : '#666',
            fontWeight: activeTab === 'received' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'all 0.2s'
          }}
        >
          Received ({receivedRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === 'sent' ? '3px solid #007bff' : '3px solid transparent',
            color: activeTab === 'sent' ? '#007bff' : '#666',
            fontWeight: activeTab === 'sent' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'all 0.2s'
          }}
        >
          Sent ({sentRequests.length})
        </button>
      </div>

      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: '#fee',
          color: '#c33',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          {error}
        </div>
      )}

      {requestsToShow.length === 0 ? (
        <div style={{
          padding: '60px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          border: '2px dashed #ddd'
        }}>
          <p style={{ fontSize: '18px', color: '#666', margin: 0 }}>
            {activeTab === 'sent' 
              ? "You haven't sent any exchange requests yet" 
              : "You don't have any pending exchange requests"}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '24px' }}>
          {requestsToShow.map((request) => {
            const isRequester = request.requesterID === user?.userID
            const canAccept = !isRequester && request.status === 'Pending'
            const canReject = !isRequester && request.status === 'Pending'
            const canReturn = request.status === 'Accepted' && !request.isReturned && isRequester
            const formattedExchangeDate = request.dateExchanged ? formatDate(request.dateExchanged) : null

            return (
              <div
                key={request.requestID}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb'
                }}
              >
                {/* Header */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '20px',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#666', 
                      marginBottom: '4px' 
                    }}>
                      {isRequester ? (
                        <>Requested from <strong>{request.receiverName}</strong></>
                      ) : (
                        <>Requested by <strong>{request.requesterName}</strong></>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {formatDate(request.dateCreated)}
                    </div>
                  </div>
                  <div style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    backgroundColor: getStatusBg(request.status),
                    color: getStatusColor(request.status),
                    fontSize: '14px',
                    fontWeight: 600
                  }}>
                    {request.status}
                  </div>
                </div>

                {/* Books Exchange */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  gap: '24px',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  {/* Your Book (What you're giving) */}
                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: '#f8f9fa',
                    border: '2px solid #e5e7eb'
                  }}>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#666', 
                      marginBottom: '8px',
                      fontWeight: 600
                    }}>
                      YOU GIVE
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start'
                    }}>
                      {(isRequester ? request.requesterBookISBN : request.receiverBookISBN) ? (
                        <img
                          src={getBookCoverUrl(isRequester ? request.requesterBookISBN : request.receiverBookISBN)}
                          alt={isRequester ? request.requesterBookTitle : request.receiverBookTitle}
                          style={{
                            width: '80px',
                            height: '120px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            flexShrink: 0
                          }}
                          onError={(e) => {
                            const img = e.target as HTMLImageElement
                            img.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '80px',
                          height: '120px',
                          backgroundColor: '#ddd',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px',
                          flexShrink: 0
                        }}>
                          📚
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          marginBottom: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {isRequester ? request.requesterBookTitle : request.receiverBookTitle}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                          {isRequester ? request.requesterBookAuthor : request.receiverBookAuthor}
                        </div>
                        <div style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#e3f2fd',
                          color: '#1976d2',
                          fontSize: '12px',
                          fontWeight: 500
                        }}>
                          {isRequester ? request.requesterBookCondition : request.receiverBookCondition}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div style={{
                    fontSize: '32px',
                    color: '#007bff',
                    fontWeight: 'bold'
                  }}>
                    ⇄
                  </div>

                  {/* Their Book (What you're receiving) */}
                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: '#f8f9fa',
                    border: '2px solid #e5e7eb'
                  }}>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#666', 
                      marginBottom: '8px',
                      fontWeight: 600
                    }}>
                      YOU RECEIVE
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start'
                    }}>
                      {(isRequester ? request.receiverBookISBN : request.requesterBookISBN) ? (
                        <img
                          src={getBookCoverUrl(isRequester ? request.receiverBookISBN : request.requesterBookISBN)}
                          alt={isRequester ? request.receiverBookTitle : request.requesterBookTitle}
                          style={{
                            width: '80px',
                            height: '120px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            flexShrink: 0
                          }}
                          onError={(e) => {
                            const img = e.target as HTMLImageElement
                            img.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '80px',
                          height: '120px',
                          backgroundColor: '#ddd',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px',
                          flexShrink: 0
                        }}>
                          📚
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          marginBottom: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {isRequester ? request.receiverBookTitle : request.requesterBookTitle}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                          {isRequester ? request.receiverBookAuthor : request.requesterBookAuthor}
                        </div>
                        <div style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#e3f2fd',
                          color: '#1976d2',
                          fontSize: '12px',
                          fontWeight: 500
                        }}>
                          {isRequester ? request.receiverBookCondition : request.requesterBookCondition}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {request.status === 'Pending' && !isRequester && (
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    justifyContent: 'flex-end',
                    paddingTop: '16px',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <button
                      onClick={() => handleReject(request.requestID)}
                      disabled={processing.has(request.requestID)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: '1px solid #dc3545',
                        backgroundColor: '#fff',
                        color: '#dc3545',
                        cursor: processing.has(request.requestID) ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        opacity: processing.has(request.requestID) ? 0.7 : 1
                      }}
                    >
                      {processing.has(request.requestID) ? 'Processing...' : 'Reject'}
                    </button>
                    <button
                      onClick={() => handleAccept(request.requestID)}
                      disabled={processing.has(request.requestID)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#28a745',
                        color: '#fff',
                        cursor: processing.has(request.requestID) ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        opacity: processing.has(request.requestID) ? 0.7 : 1
                      }}
                    >
                      {processing.has(request.requestID) ? 'Processing...' : 'Accept'}
                    </button>
                  </div>
                )}

                {canReturn && (
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    justifyContent: 'flex-end',
                    paddingTop: '16px',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <button
                      onClick={() => handleReturn(request.requestID)}
                      disabled={processing.has(request.requestID)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#17a2b8',
                        color: '#fff',
                        cursor: processing.has(request.requestID) ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        opacity: processing.has(request.requestID) ? 0.7 : 1
                      }}
                    >
                      {processing.has(request.requestID) ? 'Processing...' : 'Mark as Returned'}
                    </button>
                  </div>
                )}

                {formattedExchangeDate && (
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    Exchanged on: {formattedExchangeDate}
                    {request.isReturned && <span style={{ marginLeft: '12px', color: '#28a745' }}>✓ Returned</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Swap Request Modal */}
      {showSwapModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>
                Send Swap Request
              </h2>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {swapError && (
              <div style={{
                padding: '12px',
                backgroundColor: '#fee',
                color: '#c33',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {swapError}
              </div>
            )}

            {!selectedBook ? (
              <>
                {/* Step 1: Search for a book */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '16px' }}>
                    Search for a book you want
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, author, genre, or publisher..."
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {loadingSearch && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    Searching...
                  </div>
                )}

                {!loadingSearch && searchResults.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '16px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    padding: '8px'
                  }}>
                    {searchResults.map((book) => (
                      <button
                        key={book.bookID}
                        onClick={() => handleBookSelect(book)}
                        style={{
                          background: '#fff',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          padding: '12px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#007bff'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,123,255,0.15)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        {book.isbn && (
                          <img
                            src={getBookCoverUrl(book.isbn)}
                            alt={book.title}
                            style={{
                              width: '100%',
                              height: '150px',
                              objectFit: 'cover',
                              borderRadius: '6px'
                            }}
                            onError={(e) => {
                              const img = e.target as HTMLImageElement
                              img.style.display = 'none'
                            }}
                          />
                        )}
                        <div style={{ fontSize: '14px', fontWeight: 600, lineHeight: '1.4' }}>
                          {book.title}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {book.author}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {!loadingSearch && searchQuery && searchResults.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    No books found. Try a different search term.
                  </div>
                )}
              </>
            ) : !selectedOwner ? (
              <>
                {/* Step 2: Select a book owner */}
                <div style={{ marginBottom: '24px' }}>
                  <button
                    onClick={() => {
                      setSelectedBook(null)
                      setBookOwners([])
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#007bff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      marginBottom: '16px',
                      padding: 0
                    }}
                  >
                    ← Back to search
                  </button>
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
                      {selectedBook.title}
                    </h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                      {selectedBook.author}
                    </p>
                  </div>
                </div>

                {loadingOwners && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    Loading book owners...
                  </div>
                )}

                {!loadingOwners && bookOwners.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    No one has this book available for exchange.
                  </div>
                )}

                {!loadingOwners && bookOwners.length > 0 && (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {bookOwners.map((owner) => (
                      <button
                        key={owner.copyID}
                        onClick={() => setSelectedOwner(owner)}
                        style={{
                          background: '#fff',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          padding: '16px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s',
                          display: 'flex',
                          gap: '16px',
                          alignItems: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#007bff'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,123,255,0.15)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        {owner.isbn && (
                          <img
                            src={getBookCoverUrl(owner.isbn)}
                            alt={owner.title}
                            style={{
                              width: '60px',
                              height: '90px',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              flexShrink: 0
                            }}
                            onError={(e) => {
                              const img = e.target as HTMLImageElement
                              img.style.display = 'none'
                            }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                            {owner.ownerName}
                          </div>
                          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                            Condition: <span style={{ fontWeight: 600 }}>{owner.condition}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Step 3: Select your book to offer */}
                <div style={{ marginBottom: '24px' }}>
                  <button
                    onClick={() => {
                      setSelectedOwner(null)
                      setSelectedUserBook(null)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#007bff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      marginBottom: '16px',
                      padding: 0
                    }}
                  >
                    ← Back to owners
                  </button>
                  <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                      You want to receive:
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
                      {selectedBook.title}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      from {selectedOwner.ownerName}
                    </div>
                  </div>
                </div>

                {loadingUserBooks && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    Loading your books...
                  </div>
                )}

                {!loadingUserBooks && userBooks.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    You don't have any books available for exchange. Add books to your library and mark them as available for exchange.
                  </div>
                )}

                {!loadingUserBooks && userBooks.length > 0 && (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '16px' }}>
                        Select a book to offer in exchange:
                      </label>
                    </div>
                    <div style={{ display: 'grid', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                      {userBooks.map((book) => (
                        <button
                          key={book.copyID}
                          onClick={() => setSelectedUserBook(book)}
                          style={{
                            background: selectedUserBook?.copyID === book.copyID ? '#e3f2fd' : '#fff',
                            border: `2px solid ${selectedUserBook?.copyID === book.copyID ? '#007bff' : '#e5e7eb'}`,
                            borderRadius: '12px',
                            padding: '16px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s',
                            display: 'flex',
                            gap: '16px',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => {
                            if (selectedUserBook?.copyID !== book.copyID) {
                              e.currentTarget.style.borderColor = '#007bff'
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,123,255,0.15)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedUserBook?.copyID !== book.copyID) {
                              e.currentTarget.style.borderColor = '#e5e7eb'
                              e.currentTarget.style.boxShadow = 'none'
                            }
                          }}
                        >
                          {book.isbn && (
                            <img
                              src={getBookCoverUrl(book.isbn)}
                              alt={book.title}
                              style={{
                                width: '60px',
                                height: '90px',
                                objectFit: 'cover',
                                borderRadius: '6px',
                                flexShrink: 0
                              }}
                              onError={(e) => {
                                const img = e.target as HTMLImageElement
                                img.style.display = 'none'
                              }}
                            />
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                              {book.title}
                            </div>
                            <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                              {book.author}
                            </div>
                            <div style={{ fontSize: '14px', color: '#666' }}>
                              Condition: <span style={{ fontWeight: 600 }}>{book.condition}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {selectedUserBook && (
                      <div style={{ 
                        marginTop: '24px', 
                        display: 'flex', 
                        gap: '12px', 
                        justifyContent: 'flex-end',
                        paddingTop: '24px',
                        borderTop: '1px solid #e5e7eb'
                      }}>
                        <button
                          onClick={handleCloseModal}
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
                          onClick={handleSendRequest}
                          disabled={sendingRequest}
                          style={{
                            padding: '10px 24px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#007bff',
                            color: '#fff',
                            cursor: sendingRequest ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: 600,
                            opacity: sendingRequest ? 0.7 : 1
                          }}
                        >
                          {sendingRequest ? 'Sending...' : 'Send Swap Request'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SwapCenter
